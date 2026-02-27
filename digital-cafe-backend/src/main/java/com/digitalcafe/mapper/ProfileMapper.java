package com.digitalcafe.mapper;

import com.digitalcafe.dto.request.ProfileRequest;
import com.digitalcafe.dto.response.ProfileResponse;
import com.digitalcafe.entity.AcademicInfo;
import com.digitalcafe.entity.Address;
import com.digitalcafe.entity.Profile;
import com.digitalcafe.entity.WorkExperience;
import org.mapstruct.*;

import java.util.List;

/**
 * MapStruct mapper for Profile entity and DTOs.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ProfileMapper {

    @Mapping(target = "fullName", expression = "java(profile.getFullName())")
    @Mapping(target = "completionPercentage", expression = "java(profile.calculateCompletionPercentage())")
    @Mapping(source = "address", target = "address")
    @Mapping(source = "academicInformation", target = "academicInformation")
    @Mapping(source = "workExperiences", target = "workExperiences")
    ProfileResponse toResponse(Profile profile);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    Profile toEntity(ProfileRequest request);

    @Mapping(target = "fullAddress", expression = "java(address.getFullAddress())")
    ProfileResponse.AddressResponse toAddressResponse(Address address);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "profile", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    Address toAddressEntity(ProfileRequest.AddressRequest request);

    ProfileResponse.AcademicInfoResponse toAcademicInfoResponse(AcademicInfo academicInfo);

    List<ProfileResponse.AcademicInfoResponse> toAcademicInfoResponseList(List<AcademicInfo> academicInfos);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "profile", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    AcademicInfo toAcademicInfoEntity(ProfileRequest.AcademicInfoRequest request);

    List<AcademicInfo> toAcademicInfoEntityList(List<ProfileRequest.AcademicInfoRequest> requests);

    ProfileResponse.WorkExperienceResponse toWorkExperienceResponse(WorkExperience workExperience);

    List<ProfileResponse.WorkExperienceResponse> toWorkExperienceResponseList(List<WorkExperience> workExperiences);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "profile", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    WorkExperience toWorkExperienceEntity(ProfileRequest.WorkExperienceRequest request);

    List<WorkExperience> toWorkExperienceEntityList(List<ProfileRequest.WorkExperienceRequest> requests);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    void updateProfileFromRequest(ProfileRequest request, @MappingTarget Profile profile);
}
