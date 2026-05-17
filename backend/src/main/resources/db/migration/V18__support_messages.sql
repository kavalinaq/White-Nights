CREATE TABLE support_messages
(
    support_message_id BIGSERIAL PRIMARY KEY,
    user_id            BIGINT       NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    subject            VARCHAR(200) NOT NULL,
    message            TEXT         NOT NULL,
    response           TEXT,
    responded_at       TIMESTAMP,
    responded_by       BIGINT       REFERENCES users (user_id) ON DELETE SET NULL,
    status             VARCHAR(16)  NOT NULL DEFAULT 'open',
    created_at         TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_messages_user_id ON support_messages (user_id);
CREATE INDEX idx_support_messages_status ON support_messages (status);
