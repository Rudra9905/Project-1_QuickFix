package com.quickhelper.backend.repository;

import com.quickhelper.backend.model.Notification;
import com.quickhelper.backend.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
// JPA repository for notification persistence and queries by receiver
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByReceiverIdAndReceiverRoleOrderByCreatedAtDesc(Long receiverId, UserRole receiverRole);
    List<Notification> findByReceiverIdAndReceiverRoleAndIsReadFalseOrderByCreatedAtDesc(Long receiverId, UserRole receiverRole);
    Long countByReceiverIdAndReceiverRoleAndIsReadFalse(Long receiverId, UserRole receiverRole);
}