package com.digitalcafe.mapper;

import com.digitalcafe.dto.request.TableRequest;
import com.digitalcafe.dto.response.TableResponse;
import com.digitalcafe.entity.CafeTable;
import org.mapstruct.*;

import java.util.List;

/**
 * MapStruct mapper for CafeTable entity and DTOs.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface TableMapper {

    @Mapping(target = "displayName", expression = "java(table.getDisplayName())")
    @Mapping(target = "cafeId", source = "cafe.id")
    @Mapping(target = "cafeName", source = "cafe.name")
    TableResponse toResponse(CafeTable table);

    List<TableResponse> toResponseList(List<CafeTable> tables);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "cafe", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    CafeTable toEntity(TableRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "cafe", ignore = true)
    void updateTableFromRequest(TableRequest request, @MappingTarget CafeTable table);
}
