export type AccountStatus = "ACTIVE" | "DISABLED";
export type PreferenceTheme = "LIGHT" | "DARK";

export interface AdminProfilePreferences {
  theme: PreferenceTheme;
  autoRefreshSeconds: number;
  adminNotificationsEnabled: boolean;
}

export interface AdminProfile {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  role: string;
  profileImageUrl: string | null;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  preferences: AdminProfilePreferences;
}

export interface AdminProfileUpdateRequest {
  firstName: string;
  lastName: string;
  displayName: string;
  theme: PreferenceTheme;
  autoRefreshSeconds: number;
  adminNotificationsEnabled: boolean;
}

export interface ProfileImageUploadResponse {
  profileImageUrl: string;
}
