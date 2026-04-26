package com.whitenights.tag.service;

import com.whitenights.tag.domain.Tag;
import com.whitenights.tag.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;

    public List<Tag> search(String query, int limit) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return tagRepository.searchByPrefix(query.trim(), PageRequest.of(0, limit));
    }

    public List<Tag> recent(Long userId, int limit) {
        List<Tag> userRecent = tagRepository.findRecentByUser(userId, limit);
        if (userRecent.size() >= limit) {
            return userRecent;
        }
        List<Long> alreadyIncluded = userRecent.stream().map(Tag::getTagId).toList();
        List<Tag> popular = tagRepository.findGlobalPopular(limit).stream()
                .filter(t -> !alreadyIncluded.contains(t.getTagId()))
                .limit(limit - userRecent.size())
                .toList();
        return merge(userRecent, popular);
    }

    @Transactional
    public Tag findOrCreate(String name) {
        return tagRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> tagRepository.save(Tag.builder().name(name.toLowerCase()).build()));
    }

    public Tag findById(Long id) {
        return tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found: " + id));
    }

    private List<Tag> merge(List<Tag> a, List<Tag> b) {
        return java.util.stream.Stream.concat(a.stream(), b.stream()).toList();
    }
}
