package com.subastasya.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BidMessageDTO {
    private Long auctionId;
    private Long itemId;
    private String user;
    private String type; // "BID", "CHAT", "UPDATE"
    private String content; // message content if CHAT
    private Double amount;
    private Double minBid;
    private Double maxBid;
}
