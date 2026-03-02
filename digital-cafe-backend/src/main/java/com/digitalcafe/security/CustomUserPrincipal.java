package com.digitalcafe.security;

import com.digitalcafe.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.stream.Collectors;

/**
 * Custom UserDetails implementation that holds the full User entity,
 * allowing controllers to extract userId from the Authentication principal
 * without an extra database lookup.
 *
 * Usage in controllers:
 *   CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
 *   Long userId = principal.getId();
 */
public class CustomUserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final boolean isActive;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserPrincipal(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPassword();
        this.isActive = Boolean.TRUE.equals(user.getIsActive());
        this.authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName().name()))
                .collect(Collectors.toList());
    }

    public Long getId() {
        return id;
    }

    @Override public String getUsername()              { return email; }
    @Override public String getPassword()              { return password; }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()               { return isActive; }
}
