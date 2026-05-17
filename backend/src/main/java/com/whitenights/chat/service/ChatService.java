package com.whitenights.chat.service;

import com.whitenights.auth.domain.User;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.chat.api.dto.ChatMemberResponse;
import com.whitenights.chat.api.dto.ChatResponse;
import com.whitenights.chat.api.dto.MessageResponse;
import com.whitenights.chat.domain.Chat;
import com.whitenights.chat.domain.ChatMember;
import com.whitenights.chat.domain.ChatMemberRole;
import com.whitenights.chat.domain.Message;
import com.whitenights.chat.repository.ChatMemberRepository;
import com.whitenights.chat.repository.ChatRepository;
import com.whitenights.chat.repository.MessageRepository;
import com.whitenights.common.exception.types.BadRequestException;
import com.whitenights.common.exception.types.ForbiddenException;
import com.whitenights.common.exception.types.NotFoundException;
import com.whitenights.common.storage.StorageService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    @Value("${minio.chat-bucket}")
    private String chatBucket;

    @Transactional(readOnly = true)
    public List<ChatResponse> getChats(User user) {
      List<Chat> chats = chatRepository.findByMember(user.getUserId());
      if (chats.isEmpty()) {
        return List.of();
      }

      List<Long> chatIds = chats.stream().map(Chat::getChatId).toList();
      Map<Long, List<ChatMember>> membersByChat = chatMemberRepository
          .findByChatIdInFetchUser(chatIds).stream()
          .collect(Collectors.groupingBy(m -> m.getId().getChatId()));
      Map<Long, Message> latestByChat = messageRepository
          .findLatestMessagesByChatIdIn(chatIds).stream()
          .collect(Collectors.toMap(m -> m.getChat().getChatId(), m -> m));

      return chats.stream()
          .map(c -> toChatResponse(
              c,
              user,
              membersByChat.getOrDefault(c.getChatId(), List.of()),
              latestByChat.get(c.getChatId())))
                .toList();
    }

    @Transactional
    public ChatResponse createChat(Long peerId, String name, List<Long> memberIds, User creator) {
        if (peerId != null) {
            return chatRepository.findExisting1v1(creator.getUserId(), peerId)
                    .map(c -> toChatResponse(c, creator))
                    .orElseGet(() -> create1v1(peerId, creator));
        }
        return createGroup(name, memberIds, creator);
    }

  @Transactional(readOnly = true)
    public List<MessageResponse> getMessages(Long chatId, Long cursor, int limit, User user) {
        requireMember(chatId, user);
        return messageRepository.findByChatWithCursor(chatId, cursor, PageRequest.of(0, Math.min(limit, 50)))
                .stream()
                .map(this::toMessageResponse)
                .toList();
    }

    @Transactional
    public void addMember(Long chatId, Long userId, User requester) {
        Chat chat = requireChat(chatId);
        requireOwner(chatId, requester);
        User newMember = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (!chatMemberRepository.existsByIdChatIdAndIdUserId(chatId, userId)) {
            chatMemberRepository.save(ChatMember.builder()
                    .id(new ChatMember.ChatMemberId(chatId, userId))
                    .chat(chat)
                    .user(newMember)
                    .role(ChatMemberRole.member)
                    .build());
        }
    }

    @Transactional
    public void removeMember(Long chatId, Long userId, User requester) {
        requireOwner(chatId, requester);
        chatMemberRepository.deleteById(new ChatMember.ChatMemberId(chatId, userId));
    }

    @Transactional
    public void deleteChat(Long chatId, User user) {
        requireMember(chatId, user);
        messageRepository.deleteByChatChatId(chatId);
        chatMemberRepository.deleteByIdChatId(chatId);
        chatRepository.deleteById(chatId);
    }

    @Transactional
    public MessageResponse deleteMessage(Long messageId, User user) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new NotFoundException("Message not found"));
        if (!message.getSender().getUserId().equals(user.getUserId())) {
            throw new ForbiddenException("Access denied");
        }
        message.setDeleted(true);
        messageRepository.save(message);
        return toMessageResponse(message);
    }

    public MessageResponse saveAndBuildResponse(Long chatId, String text, User sender) {
        Chat chat = requireChat(chatId);
        requireMember(chatId, sender);
        Message message = messageRepository.save(Message.builder()
                .chat(chat)
                .sender(sender)
                .text(text)
                .build());
        return toMessageResponse(message);
    }

    @Transactional
    public MessageResponse saveImageMessage(Long chatId, MultipartFile file, User sender) {
        Chat chat = requireChat(chatId);
        requireMember(chatId, sender);
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
          throw new BadRequestException("Only image files are allowed");
        }
        String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
        String imageUrl = storageService.uploadFile(chatBucket, filename, file);
        Message message = messageRepository.save(Message.builder()
                .chat(chat)
                .sender(sender)
                .imageUrl(imageUrl)
                .build());
        return toMessageResponse(message);
    }

    private ChatResponse create1v1(Long peerId, User creator) {
        User peer = userRepository.findById(peerId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (!peer.isVerified()) {
            throw new ForbiddenException("Cannot start a chat with an unverified user");
        }
        Chat chat = chatRepository.save(Chat.builder().createdBy(creator).isGroup(false).build());
        addMemberRow(chat, creator, ChatMemberRole.member);
        addMemberRow(chat, peer, ChatMemberRole.member);
        return toChatResponse(chat, creator);
    }

    private ChatResponse createGroup(String name, List<Long> memberIds, User creator) {
        Chat chat = chatRepository.save(Chat.builder().createdBy(creator).name(name).isGroup(true).build());
        addMemberRow(chat, creator, ChatMemberRole.owner);
        if (memberIds != null) {
            memberIds.stream()
                    .distinct()
                    .filter(id -> !id.equals(creator.getUserId()))
                    .map(id -> userRepository.findById(id).orElseThrow(() -> new NotFoundException("User not found: " + id)))
                    .forEach(u -> addMemberRow(chat, u, ChatMemberRole.member));
        }
        return toChatResponse(chat, creator);
    }

    private void addMemberRow(Chat chat, User user, ChatMemberRole role) {
        chatMemberRepository.save(ChatMember.builder()
                .id(new ChatMember.ChatMemberId(chat.getChatId(), user.getUserId()))
                .chat(chat)
                .user(user)
                .role(role)
                .build());
    }

    private Chat requireChat(Long chatId) {
        return chatRepository.findById(chatId)
                .orElseThrow(() -> new NotFoundException("Chat not found"));
    }

    private void requireMember(Long chatId, User user) {
        if (!chatMemberRepository.existsByIdChatIdAndIdUserId(chatId, user.getUserId())) {
            throw new ForbiddenException("Not a member of this chat");
        }
    }

    private void requireOwner(Long chatId, User user) {
        ChatMember member = chatMemberRepository
                .findById(new ChatMember.ChatMemberId(chatId, user.getUserId()))
                .orElseThrow(() -> new ForbiddenException("Not a member of this chat"));
        if (member.getRole() != ChatMemberRole.owner) {
            throw new ForbiddenException("Only the owner can perform this action");
        }
    }

    private ChatResponse toChatResponse(Chat chat, User viewer) {
        List<ChatMember> members = chatMemberRepository.findByIdChatId(chat.getChatId());
        List<Message> latest = messageRepository.findLatestMessage(chat.getChatId(), PageRequest.of(0, 1));
      Message latestMessage = latest.isEmpty() ? null : latest.get(0);
      return toChatResponse(chat, viewer, members, latestMessage);
    }

  private ChatResponse toChatResponse(Chat chat, User viewer, List<ChatMember> members, Message latestMessage) {
    MessageResponse lastMsg = latestMessage != null ? toMessageResponse(latestMessage) : null;

        String displayName = chat.isGroup() ? chat.getName()
                : members.stream()
                .filter(m -> !m.getId().getUserId().equals(viewer.getUserId()))
                .findFirst()
                .map(m -> m.getUser().getNickname())
                .orElse("Unknown");

    Long ownerId = members.stream()
        .filter(m -> m.getRole() == ChatMemberRole.owner)
        .map(m -> m.getId().getUserId())
        .findFirst()
        .orElse(null);

    return new ChatResponse(
        chat.getChatId(),
        displayName,
        chat.isGroup(),
        members.size(),
        lastMsg,
        chat.getAvatarUrl(),
        ownerId
    );
  }

  @Transactional(readOnly = true)
  public List<ChatMemberResponse> getMembers(Long chatId, User requester) {
    requireMember(chatId, requester);
    return chatMemberRepository.findByIdChatId(chatId).stream()
        .map(m -> new ChatMemberResponse(
            m.getUser().getUserId(),
            m.getUser().getNickname(),
            m.getUser().getAvatarUrl(),
            m.getRole().name(),
            m.getJoinedAt()
        ))
        .toList();
  }

  @Transactional
  public ChatResponse updateAvatar(Long chatId, MultipartFile file, User requester) {
    Chat chat = requireChat(chatId);
    if (!chat.isGroup()) {
      throw new ForbiddenException("Avatar can only be set for group chats");
    }
    requireOwner(chatId, requester);
    String contentType = file.getContentType();
    if (contentType == null || !contentType.startsWith("image/")) {
      throw new BadRequestException("Only image files are allowed");
    }
    String filename = "avatar_" + chatId + "_" + UUID.randomUUID();
    String url = storageService.uploadFile(chatBucket, filename, file);

    String previousUrl = chat.getAvatarUrl();
    chat.setAvatarUrl(url);
    chatRepository.save(chat);

    deleteAvatarBlob(previousUrl);
    return toChatResponse(chat, requester);
  }

  private void deleteAvatarBlob(String url) {
    if (url == null || url.isBlank()) {
      return;
    }
    int slash = url.lastIndexOf('/');
    if (slash < 0 || slash == url.length() - 1) {
      return;
    }
    String filename = url.substring(slash + 1);
    storageService.deleteFile(chatBucket, filename);
    }

    public MessageResponse toMessageResponse(Message m) {
        return new MessageResponse(
                m.getMessageId(),
                m.getChat().getChatId(),
                m.getSender() != null ? m.getSender().getUserId() : null,
                m.getSender() != null ? m.getSender().getNickname() : null,
                m.isDeleted() ? null : m.getText(),
                m.isDeleted() ? null : m.getImageUrl(),
                m.isDeleted(),
                m.getSentAt()
        );
    }
}
