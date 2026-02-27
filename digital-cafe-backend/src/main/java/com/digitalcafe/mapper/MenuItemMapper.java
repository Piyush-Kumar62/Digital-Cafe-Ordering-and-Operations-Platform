package com.digitalcafe.mapper;

import com.digitalcafe.dto.request.MenuItemRequest;
import com.digitalcafe.dto.response.MenuItemResponse;
import com.digitalcafe.entity.MenuItem;
import org.mapstruct.*;

import java.util.List;

/**
 * MapStruct mapper for MenuItem entity and DTOs.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface MenuItemMapper {

    @Mapping(target = "cafeId", source = "cafe.id")
    @Mapping(target = "cafeName", source = "cafe.name")
    MenuItemResponse toResponse(MenuItem menuItem);

    List<MenuItemResponse> toResponseList(List<MenuItem> menuItems);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "cafe", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    MenuItem toEntity(MenuItemRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "cafe", ignore = true)
    void updateMenuItemFromRequest(MenuItemRequest request, @MappingTarget MenuItem menuItem);
}
