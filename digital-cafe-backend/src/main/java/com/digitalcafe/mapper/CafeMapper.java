package com.digitalcafe.mapper;

import com.digitalcafe.dto.request.CafeRequest;
import com.digitalcafe.dto.response.CafeResponse;
import com.digitalcafe.entity.Cafe;
import org.mapstruct.*;

import java.util.List;

/**
 * MapStruct mapper for Cafe entity and DTOs.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CafeMapper {

    @Mapping(target = "ownerId", source = "owner.id")
    @Mapping(target = "ownerName", expression = "java(getOwnerName(cafe))")
    @Mapping(target = "totalTables", expression = "java(cafe.getTables() != null ? cafe.getTables().size() : 0)")
    @Mapping(target = "availableTables", expression = "java(countAvailableTables(cafe))")
    @Mapping(target = "totalMenuItems", expression = "java(cafe.getMenuItems() != null ? cafe.getMenuItems().size() : 0)")
    CafeResponse toResponse(Cafe cafe);

    List<CafeResponse> toResponseList(List<Cafe> cafes);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "tables", ignore = true)
    @Mapping(target = "menuItems", ignore = true)
    @Mapping(target = "rating", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    Cafe toEntity(CafeRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "tables", ignore = true)
    @Mapping(target = "menuItems", ignore = true)
    void updateCafeFromRequest(CafeRequest request, @MappingTarget Cafe cafe);

    default String getOwnerName(Cafe cafe) {
        if (cafe == null || cafe.getOwner() == null) {
            return null;
        }
        var owner = cafe.getOwner();
        if (owner.getProfile() != null && owner.getProfile().getFullName() != null
                && !owner.getProfile().getFullName().isBlank()) {
            return owner.getProfile().getFullName();
        }
        if (owner.getDisplayName() != null && !owner.getDisplayName().isBlank()) {
            return owner.getDisplayName();
        }
        String first = owner.getFirstName() != null ? owner.getFirstName().trim() : "";
        String last = owner.getLastName() != null ? owner.getLastName().trim() : "";
        String full = (first + " " + last).trim();
        if (!full.isBlank()) {
            return full;
        }
        if (owner.getEmail() != null && !owner.getEmail().isBlank()) {
            return owner.getEmail();
        }
        return "Unknown Owner";
    }

    default Integer countAvailableTables(Cafe cafe) {
        if (cafe.getTables() == null) {
            return 0;
        }
        return (int) cafe.getTables().stream()
                .filter(table -> Boolean.TRUE.equals(table.getIsAvailable()))
                .count();
    }

    default List<String> mapGalleryImages(List<com.digitalcafe.entity.CafeGallery> galleryImages) {
        if (galleryImages == null) {
            return null;
        }
        return galleryImages.stream()
                .map(com.digitalcafe.entity.CafeGallery::getImageUrl)
                .toList();
    }
}
