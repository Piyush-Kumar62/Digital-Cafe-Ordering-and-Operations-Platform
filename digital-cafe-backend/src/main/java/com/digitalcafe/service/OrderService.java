package com.digitalcafe.service;

import com.digitalcafe.dto.OrderDTO;
import com.digitalcafe.dto.OrderItemDTO;
import com.digitalcafe.dto.OrderRequestDTO;
import com.digitalcafe.exception.BadRequestException;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.model.*;
import com.digitalcafe.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CafeRepository cafeRepository;
    private final MenuItemRepository menuItemRepository;

    @Transactional(readOnly = true)
    public List<OrderDTO> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderDTO getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        return convertToDTO(order);
    }

    @Transactional(readOnly = true)
    public List<OrderDTO> getOrdersByCustomer(Long customerId) {
        return orderRepository.findByCustomerId(customerId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderDTO> getOrdersByCafe(Long cafeId) {
        return orderRepository.findByCafeId(cafeId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderDTO> getOrdersByStatus(String status) {
        Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
        return orderRepository.findByStatus(orderStatus).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderDTO createOrder(OrderRequestDTO requestDTO) {
        User customer = userRepository.findById(requestDTO.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", requestDTO.getCustomerId()));

        Cafe cafe = cafeRepository.findById(requestDTO.getCafeId())
                .orElseThrow(() -> new ResourceNotFoundException("Cafe", "id", requestDTO.getCafeId()));

        if (requestDTO.getOrderItems() == null || requestDTO.getOrderItems().isEmpty()) {
            throw new BadRequestException("Order must contain at least one item");
        }

        Order order = new Order();
        order.setOrderNumber(generateOrderNumber());
        order.setCustomer(customer);
        order.setCafe(cafe);
        order.setOrderType(Order.OrderType.valueOf(requestDTO.getOrderType().toUpperCase()));
        order.setSpecialInstructions(requestDTO.getSpecialInstructions());
        order.setStatus(Order.OrderStatus.PLACED);
        order.setOrderPlacedAt(LocalDateTime.now());

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (var itemRequest : requestDTO.getOrderItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemRequest.getMenuItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", itemRequest.getMenuItemId()));

            if (!menuItem.getAvailable()) {
                throw new BadRequestException("Menu item is not available: " + menuItem.getName());
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setMenuItem(menuItem);
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setPrice(menuItem.getPrice());
            orderItem.setSubtotal(menuItem.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity())));
            orderItem.setNotes(itemRequest.getNotes());

            orderItems.add(orderItem);
            totalAmount = totalAmount.add(orderItem.getSubtotal());
        }

        order.setOrderItems(orderItems);
        order.setTotalAmount(totalAmount);

        Order savedOrder = orderRepository.save(order);
        return convertToDTO(savedOrder);
    }

    @Transactional
    public OrderDTO updateOrderStatus(Long id, String status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));

        Order.OrderStatus newStatus = Order.OrderStatus.valueOf(status.toUpperCase());
        order.setStatus(newStatus);

        Order updatedOrder = orderRepository.save(order);
        return convertToDTO(updatedOrder);
    }

    @Transactional
    public OrderDTO confirmOrder(Long orderId, Long ownerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        
        if (order.getStatus() != Order.OrderStatus.PLACED) {
            throw new BadRequestException("Order can only be confirmed from PLACED status");
        }
        
        order.setStatus(Order.OrderStatus.CONFIRMED);
        Order savedOrder = orderRepository.save(order);
        
        return convertToDTO(savedOrder);
    }

    @Transactional
    public OrderDTO startPreparing(Long orderId, Long chefId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        
        User chef = userRepository.findById(chefId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", chefId));
        
        if (chef.getRole() != User.Role.CHEF) {
            throw new BadRequestException("Only chefs can start preparing orders");
        }
        
        if (order.getStatus() != Order.OrderStatus.CONFIRMED && order.getStatus() != Order.OrderStatus.PLACED) {
            throw new BadRequestException("Order can only be prepared from CONFIRMED or PLACED status");
        }
        
        order.setStatus(Order.OrderStatus.PREPARING);
        order.setPreparingStartedAt(LocalDateTime.now());
        order.setPreparedBy(chef);
        
        Order savedOrder = orderRepository.save(order);
        return convertToDTO(savedOrder);
    }

    @Transactional
    public OrderDTO markReady(Long orderId, Long chefId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        
        if (order.getStatus() != Order.OrderStatus.PREPARING) {
            throw new BadRequestException("Order can only be marked ready from PREPARING status");
        }
        
        if (order.getPreparedBy() == null || !order.getPreparedBy().getId().equals(chefId)) {
            throw new BadRequestException("Only the chef preparing this order can mark it ready");
        }
        
        order.setStatus(Order.OrderStatus.READY);
        order.setReadyAt(LocalDateTime.now());
        
        Order savedOrder = orderRepository.save(order);
        return convertToDTO(savedOrder);
    }

    @Transactional
    public OrderDTO markServed(Long orderId, Long waiterId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        
        User waiter = userRepository.findById(waiterId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", waiterId));
        
        if (waiter.getRole() != User.Role.WAITER) {
            throw new BadRequestException("Only waiters can serve orders");
        }
        
        if (order.getStatus() != Order.OrderStatus.READY) {
            throw new BadRequestException("Order can only be served from READY status");
        }
        
        order.setStatus(Order.OrderStatus.SERVED);
        order.setServedAt(LocalDateTime.now());
        order.setServedBy(waiter);
        
        Order savedOrder = orderRepository.save(order);
        return convertToDTO(savedOrder);
    }

    @Transactional
    public OrderDTO completeOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        
        if (order.getStatus() != Order.OrderStatus.SERVED) {
            throw new BadRequestException("Order can only be completed from SERVED status");
        }
        
        order.setStatus(Order.OrderStatus.COMPLETED);
        order.setCompletedAt(LocalDateTime.now());
        
        Order savedOrder = orderRepository.save(order);
        return convertToDTO(savedOrder);
    }

    @Transactional
    public OrderDTO cancelOrder(Long orderId, String reason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        
        if (order.getStatus() == Order.OrderStatus.COMPLETED || 
            order.getStatus() == Order.OrderStatus.CANCELLED) {
            throw new BadRequestException("Cannot cancel completed or already cancelled order");
        }
        
        order.setStatus(Order.OrderStatus.CANCELLED);
        order.setSpecialInstructions(order.getSpecialInstructions() + " | Cancelled: " + reason);
        
        Order savedOrder = orderRepository.save(order);
        return convertToDTO(savedOrder);
    }

    @Transactional
    public void deleteOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        orderRepository.delete(order);
    }

    private String generateOrderNumber() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        return "ORD" + timestamp;
    }

    private OrderDTO convertToDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setCustomerId(order.getCustomer().getId());
        dto.setCustomerName(order.getCustomer().getUsername());
        dto.setCafeId(order.getCafe().getId());
        dto.setCafeName(order.getCafe().getName());
        dto.setStatus(order.getStatus().name());
        dto.setOrderType(order.getOrderType().name());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setSpecialInstructions(order.getSpecialInstructions());
        dto.setCreatedAt(order.getCreatedAt());

        if (order.getOrderItems() != null) {
            List<OrderItemDTO> orderItemDTOs = order.getOrderItems().stream()
                    .map(this::convertOrderItemToDTO)
                    .collect(Collectors.toList());
            dto.setOrderItems(orderItemDTOs);
        }

        return dto;
    }

    private OrderItemDTO convertOrderItemToDTO(OrderItem orderItem) {
        OrderItemDTO dto = new OrderItemDTO();
        dto.setId(orderItem.getId());
        dto.setMenuItemId(orderItem.getMenuItem().getId());
        dto.setMenuItemName(orderItem.getMenuItem().getName());
        dto.setQuantity(orderItem.getQuantity());
        dto.setPrice(orderItem.getPrice());
        dto.setSubtotal(orderItem.getSubtotal());
        dto.setNotes(orderItem.getNotes());
        return dto;
    }
}
