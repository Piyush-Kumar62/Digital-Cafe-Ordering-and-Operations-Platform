package com.digitalcafe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardDTO {
    private Long totalUsers;
    private Long activeUsers;
    private Long inactiveUsers;
    private Long unverifiedEmails;
    private Long incompleteProfiles;
    private Long totalCafes;
    private Long todayRegistrations;
    private List<Integer> weeklyGrowth;
    private Map<String, Long> usersByRole;
    private List<RecentUserDTO> recentUsers;
}
