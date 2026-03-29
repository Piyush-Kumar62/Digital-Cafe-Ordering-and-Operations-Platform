package com.digitalcafe.util;

import java.util.UUID;

public final class RequestIdGenerator {

    private RequestIdGenerator() {}

    public static String newShortId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }
}
