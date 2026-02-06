package com.digitalcafe.service;

import com.digitalcafe.dto.*;
import com.digitalcafe.model.*;
import com.digitalcafe.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProfileService {

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AcademicInfoRepository academicInfoRepository;

    @Autowired
    private WorkExperienceRepository workExperienceRepository;

    @Autowired
    private AddressRepository addressRepository;

    public ProfileDTO getProfileByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Profile profile = user.getProfile();
        if (profile == null) {
            throw new RuntimeException("Profile not found");
        }

        return convertToDTO(profile);
    }

    @Transactional
    public ProfileDTO updateProfile(Long userId, ProfileDTO profileDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Profile profile = user.getProfile();
        if (profile == null) {
            profile = new Profile();
            profile.setUser(user);
        }

        // Update basic info
        profile.setFirstName(profileDTO.getFirstName());
        profile.setLastName(profileDTO.getLastName());
        profile.setDateOfBirth(profileDTO.getDateOfBirth());
        if (profileDTO.getGender() != null) {
            profile.setGender(Profile.Gender.valueOf(profileDTO.getGender()));
        }
        profile.setPhone(profileDTO.getPhone());
        profile.setProfilePictureUrl(profileDTO.getProfilePictureUrl());

        // Calculate completion percentage
        profile.setCompletionPercentage(calculateCompletionPercentage(profile));

        profile = profileRepository.save(profile);

        // Update user's profileCompleted flag
        user.setProfileCompleted(profile.getCompletionPercentage() == 100);
        userRepository.save(user);

        return convertToDTO(profile);
    }

    @Transactional
    public AcademicInfoDTO addAcademicInfo(Long userId, AcademicInfoDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Profile profile = user.getProfile();
        if (profile == null) {
            throw new RuntimeException("Profile not found. Please create profile first.");
        }

        AcademicInfo academicInfo = new AcademicInfo();
        academicInfo.setProfile(profile);
        academicInfo.setDegree(dto.getDegree());
        academicInfo.setInstitution(dto.getInstitution());
        academicInfo.setEndYear(dto.getYearOfPassing());
        academicInfo.setCgpaPercentage(dto.getPercentage() != null ? dto.getPercentage().toString() : null);

        academicInfo = academicInfoRepository.save(academicInfo);

        // Recalculate completion percentage
        profile.setCompletionPercentage(calculateCompletionPercentage(profile));
        profileRepository.save(profile);

        user.setProfileCompleted(profile.getCompletionPercentage() == 100);
        userRepository.save(user);

        return convertAcademicInfoToDTO(academicInfo);
    }

    @Transactional
    public WorkExperienceDTO addWorkExperience(Long userId, WorkExperienceDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Profile profile = user.getProfile();
        if (profile == null) {
            throw new RuntimeException("Profile not found. Please create profile first.");
        }

        WorkExperience workExp = new WorkExperience();
        workExp.setProfile(profile);
        workExp.setCompany(dto.getCompany());
        workExp.setPosition(dto.getPosition());
        workExp.setStartDate(dto.getStartDate());
        workExp.setEndDate(dto.getEndDate());
        workExp.setDescription(dto.getDescription());

        workExp = workExperienceRepository.save(workExp);

        // Recalculate completion percentage
        profile.setCompletionPercentage(calculateCompletionPercentage(profile));
        profileRepository.save(profile);

        return convertWorkExperienceToDTO(workExp);
    }

    @Transactional
    public AddressDTO updateAddress(Long userId, AddressDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Profile profile = user.getProfile();
        if (profile == null) {
            throw new RuntimeException("Profile not found. Please create profile first.");
        }

        Address address = profile.getAddress();
        if (address == null) {
            address = new Address();
            address.setProfile(profile);
        }

        address.setStreet(dto.getStreet());
        address.setPlotNo(dto.getPlotNo());
        address.setCity(dto.getCity());
        address.setState(dto.getState());
        address.setPincode(dto.getPincode());
        address.setCountry(dto.getCountry());

        address = addressRepository.save(address);

        // Recalculate completion percentage
        profile.setCompletionPercentage(calculateCompletionPercentage(profile));
        profileRepository.save(profile);

        user.setProfileCompleted(profile.getCompletionPercentage() == 100);
        userRepository.save(user);

        return convertAddressToDTO(address);
    }

    public Integer getCompletionPercentage(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Profile profile = user.getProfile();
        if (profile == null) {
            return 0;
        }

        return calculateCompletionPercentage(profile);
    }

    private Integer calculateCompletionPercentage(Profile profile) {
        int totalFields = 8; // firstName, lastName, DOB, gender, phone, address, academicInfo (at least 1)
        int completedFields = 0;

        if (profile.getFirstName() != null && !profile.getFirstName().isEmpty()) completedFields++;
        if (profile.getLastName() != null && !profile.getLastName().isEmpty()) completedFields++;
        if (profile.getDateOfBirth() != null) completedFields++;
        if (profile.getGender() != null) completedFields++;
        if (profile.getPhone() != null && !profile.getPhone().isEmpty()) completedFields++;
        
        // Check address
        Address address = profile.getAddress();
        if (address != null && address.getCity() != null && address.getPincode() != null) {
            completedFields++;
        }
        
        // Check academic info (at least one entry required)
        if (profile.getAcademicInfoList() != null && !profile.getAcademicInfoList().isEmpty()) {
            completedFields++;
        }

        // Check if user's email is verified
        if (profile.getUser().getEmailVerified()) {
            completedFields++;
        }

        return (completedFields * 100) / totalFields;
    }

    private ProfileDTO convertToDTO(Profile profile) {
        ProfileDTO dto = new ProfileDTO();
        dto.setId(profile.getId());
        dto.setUserId(profile.getUser().getId());
        dto.setFirstName(profile.getFirstName());
        dto.setLastName(profile.getLastName());
        dto.setDateOfBirth(profile.getDateOfBirth());
        dto.setGender(profile.getGender() != null ? profile.getGender().toString() : null);
        dto.setPhone(profile.getPhone());
        dto.setProfilePictureUrl(profile.getProfilePictureUrl());
        dto.setCompletionPercentage(profile.getCompletionPercentage());

        // Convert academic info
        if (profile.getAcademicInfoList() != null) {
            dto.setAcademicInfo(profile.getAcademicInfoList().stream()
                    .map(this::convertAcademicInfoToDTO)
                    .collect(Collectors.toList()));
        }

        // Convert work experience
        if (profile.getWorkExperiences() != null) {
            dto.setWorkExperience(profile.getWorkExperiences().stream()
                    .map(this::convertWorkExperienceToDTO)
                    .collect(Collectors.toList()));
        }

        // Convert address
        if (profile.getAddress() != null) {
            dto.setAddress(convertAddressToDTO(profile.getAddress()));
        }

        return dto;
    }

    private AcademicInfoDTO convertAcademicInfoToDTO(AcademicInfo academicInfo) {
        AcademicInfoDTO dto = new AcademicInfoDTO();
        dto.setId(academicInfo.getId());
        dto.setDegree(academicInfo.getDegree());
        dto.setInstitution(academicInfo.getInstitution());
        dto.setYearOfPassing(academicInfo.getEndYear());
        try {
            dto.setPercentage(academicInfo.getCgpaPercentage() != null ? 
                Double.parseDouble(academicInfo.getCgpaPercentage()) : null);
        } catch (NumberFormatException e) {
            dto.setPercentage(null);
        }
        return dto;
    }

    private WorkExperienceDTO convertWorkExperienceToDTO(WorkExperience workExp) {
        WorkExperienceDTO dto = new WorkExperienceDTO();
        dto.setId(workExp.getId());
        dto.setCompany(workExp.getCompany());
        dto.setPosition(workExp.getPosition());
        dto.setStartDate(workExp.getStartDate());
        dto.setEndDate(workExp.getEndDate());
        dto.setDescription(workExp.getDescription());
        return dto;
    }

    private AddressDTO convertAddressToDTO(Address address) {
        AddressDTO dto = new AddressDTO();
        dto.setId(address.getId());
        dto.setStreet(address.getStreet());
        dto.setPlotNo(address.getPlotNo());
        dto.setCity(address.getCity());
        dto.setState(address.getState());
        dto.setPincode(address.getPincode());
        dto.setCountry(address.getCountry());
        return dto;
    }
}
