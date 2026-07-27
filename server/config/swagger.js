const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "SalonStar API",
            version: "1.0.0",
            description:
                "REST API for SalonStar, a salon booking platform. Covers authentication, the " +
                "currently authenticated user, customer profiles & bookings, and salon owner " +
                "profiles, staff, services, slots and bookings.",
        },
        servers: [
            {
                url: "http://localhost:8080",
                description: "Local development server",
            },
        ],
        security: [{ bearerAuth: [] }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description:
                        'JWT returned by /api/login or /api/register. Send it as "Authorization: Bearer <token>".',
                },
            },
            schemas: {
                Error: {
                    type: "object",
                    properties: {
                        msg: { type: "string", example: "Something went wrong." },
                    },
                },
                Role: {
                    type: "string",
                    enum: ["CUSTOMER", "SALON_OWNER", "ADMIN"],
                },
                WorkCategory: {
                    type: "string",
                    enum: ["HAIR", "BEARD", "MAKEUP", "FACIAL", "MASSAGE", "NAILS", "SKINCARE", "THREADING", "WAX"],
                },
                BookingStatus: {
                    type: "string",
                    enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"],
                },
                CancelledBy: {
                    type: "string",
                    enum: ["SALON_OWNER", "CUSTOMER"],
                },
                RegisterRequest: {
                    type: "object",
                    required: ["name", "email", "phone", "password"],
                    properties: {
                        name: { type: "string", example: "Meet Zala" },
                        email: { type: "string", format: "email", example: "meet@example.com" },
                        phone: { type: "string", example: "9876543210" },
                        password: { type: "string", format: "password", example: "Str0ngP@ss" },
                        role: { allOf: [{ $ref: "#/components/schemas/Role" }], default: "CUSTOMER" },
                        salonName: {
                            type: "string",
                            description: "Required when role is SALON_OWNER",
                            example: "Glow Studio",
                        },
                        address: { type: "string", description: "Required when role is SALON_OWNER" },
                        city: { type: "string", description: "Required when role is SALON_OWNER" },
                        pincode: { type: "string" },
                        openingTime: {
                            type: "string",
                            example: "09:00",
                            description: "Required when role is SALON_OWNER",
                        },
                        closingTime: {
                            type: "string",
                            example: "19:00",
                            description: "Required when role is SALON_OWNER",
                        },
                    },
                },
                LoginRequest: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: { type: "string", format: "email" },
                        password: { type: "string", format: "password" },
                    },
                },
                AuthResponse: {
                    type: "object",
                    properties: {
                        msg: { type: "string" },
                        token: { type: "string", description: "JWT access token" },
                    },
                },
                User: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        name: { type: "string" },
                        email: { type: "string" },
                        phone: { type: "string" },
                        role: { $ref: "#/components/schemas/Role" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                Customer: {
                    type: "object",
                    properties: {
                        userId: { type: "integer" },
                        profileUrl: { type: "string", nullable: true },
                        loyaltyScore: { type: "integer" },
                    },
                },
                CustomerUpdateRequest: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        phone: { type: "string" },
                        profileUrl: { type: "string" },
                    },
                },
                Salon: {
                    type: "object",
                    properties: {
                        userId: { type: "integer" },
                        salonName: { type: "string" },
                        bio: { type: "string", nullable: true },
                        profileUrl: { type: "string", nullable: true },
                        address: { type: "string" },
                        city: { type: "string" },
                        pincode: { type: "string", nullable: true },
                        closingTime: { type: "string", example: "19:00" },
                        openingTime: { type: "string", example: "09:00" },
                        slotInterval: { type: "integer", example: 30 },
                        isActive: { type: "boolean" },
                    },
                },
                SalonUpdateRequest: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        phone: { type: "string" },
                        salonName: { type: "string" },
                        bio: { type: "string" },
                        profileUrl: { type: "string" },
                        address: { type: "string" },
                        city: { type: "string" },
                        pincode: { type: "string" },
                        closingTime: { type: "string", example: "19:00" },
                        openingTime: { type: "string", example: "09:00" },
                        slotInterval: { type: "integer", example: 30 },
                    },
                },
                Staff: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        salonId: { type: "integer" },
                        phone: { type: "string" },
                        name: { type: "string" },
                        role: { type: "string", example: "Hair Stylist" },
                        isActive: { type: "boolean" },
                        profileUrl: { type: "string", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                StaffRequest: {
                    type: "object",
                    required: ["phone", "name", "role"],
                    properties: {
                        phone: { type: "string" },
                        name: { type: "string" },
                        role: { type: "string", example: "Hair Stylist" },
                        profileUrl: { type: "string" },
                    },
                },
                Service: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        salonId: { type: "integer" },
                        name: { type: "string" },
                        work: { $ref: "#/components/schemas/WorkCategory" },
                        description: { type: "string", nullable: true },
                        duration: { type: "integer", description: "Duration in minutes", example: 30 },
                        price: { type: "number", format: "decimal", example: 499.0 },
                        isActive: { type: "boolean" },
                    },
                },
                ServiceRequest: {
                    type: "object",
                    required: ["name", "work", "duration", "price"],
                    properties: {
                        name: { type: "string" },
                        work: { $ref: "#/components/schemas/WorkCategory" },
                        description: { type: "string" },
                        duration: { type: "integer", example: 30 },
                        price: { type: "number", example: 499.0 },
                    },
                },
                Slot: {
                    type: "object",
                    properties: {
                        startTime: { type: "string", example: "09:00" },
                        endTime: { type: "string", example: "09:30" },
                    },
                },
                Booking: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        customerId: { type: "integer" },
                        salonId: { type: "integer" },
                        serviceId: { type: "integer" },
                        staffId: { type: "integer", nullable: true },
                        startTime: { type: "string", example: "09:00" },
                        date: { type: "string", format: "date" },
                        status: { $ref: "#/components/schemas/BookingStatus" },
                        cancelledBy: { allOf: [{ $ref: "#/components/schemas/CancelledBy" }], nullable: true },
                        cancelledAt: { type: "string", format: "date-time", nullable: true },
                        notes: { type: "string", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                CustomerBookingRequest: {
                    type: "object",
                    required: ["salonId", "serviceId", "startTime", "date"],
                    properties: {
                        salonId: { type: "integer" },
                        serviceId: { type: "integer" },
                        staffId: { type: "integer" },
                        startTime: { type: "string", example: "09:00" },
                        date: { type: "string", format: "date", example: "2026-07-20" },
                        notes: { type: "string" },
                    },
                },
                BookingStatusUpdateRequest: {
                    type: "object",
                    required: ["status"],
                    properties: {
                        status: { type: "string", enum: ["CONFIRMED", "CANCELLED"] },
                    },
                },
            },
        },
    },
    apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
