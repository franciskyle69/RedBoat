"use strict";
// Centralized routing types to eliminate redundancy
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROUTE_ICONS = exports.ROUTE_PATTERNS = exports.routeParamSchema = void 0;
// Route validation schemas
exports.routeParamSchema = {
    id: /^[a-f\d]{24}$/i, // MongoDB ObjectId
    slug: /^[a-z0-9-]+$/i, // URL-friendly slug
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[\d\s-()]+$/,
    date: /^\d{4}-\d{2}-\d{2}$/
};
// Route constants
exports.ROUTE_PATTERNS = {
    ADMIN: '/admin',
    USER: '/user',
    DASHBOARD: '/dashboard',
    PROFILE: '/profile',
    LOGIN: '/login',
    SIGNUP: '/signup',
    HOME: '/'
};
exports.ROUTE_ICONS = {
    DASHBOARD: 'dashboard',
    USER: 'user',
    USERS: 'users',
    HOME: 'home',
    CALENDAR: 'calendar',
    MESSAGE: 'message',
    SETTINGS: 'settings',
    CHART: 'chart',
    CLEANING: 'cleaning',
    LOGIN: 'login',
    SIGNUP: 'signup',
    PASSWORD: 'password',
    EMAIL: 'email',
    PHONE: 'phone',
    LOCATION: 'location',
    STAR: 'star',
    HEART: 'heart',
    BELL: 'bell',
    SEARCH: 'search',
    FILTER: 'filter',
    SORT: 'sort',
    EDIT: 'edit',
    DELETE: 'delete',
    ADD: 'add',
    REMOVE: 'remove',
    CHECK: 'check',
    CROSS: 'cross',
    WARNING: 'warning',
    INFO: 'info',
    QUESTION: 'question',
    EXCLAMATION: 'exclamation'
};
