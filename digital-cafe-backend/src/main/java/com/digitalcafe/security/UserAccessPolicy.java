package com.digitalcafe.security;

import com.digitalcafe.entity.Role;
import com.digitalcafe.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserAccessPolicy {

    public boolean isSystemAdmin(User user) {
        return user != null && user.hasRole(Role.RoleName.ADMIN);
    }

    public boolean requiresEmailVerification(User user) {
        return !isSystemAdmin(user);
    }

    public boolean requiresProfileCompletion(User user) {
        if (isSystemAdmin(user)) {
            return false;
        }
        return user == null || !user.hasRole(Role.RoleName.CAFE_OWNER);
    }
}
