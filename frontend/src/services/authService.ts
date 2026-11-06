
import axios from "axios";

const API_BASE_URL =
    `${import.meta.env.VITE_API_BASE_URL}`;

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export interface AuthUser {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
}

export interface RegisterPayload {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    password: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

interface AuthResponse {
    user: AuthUser;
}

export async function registerUser(
    payload: RegisterPayload,
): Promise<AuthUser> {
    const { data } = await api.post<AuthResponse>(
        "/auth/register",
        payload,
    );
    return data.user;
}

export async function loginUser(
    payload: LoginPayload,
): Promise<AuthUser> {
    const { data } = await api.post<AuthResponse>(
        "/auth/login",
        payload,
    );
    return data.user;
}

export async function getCurrentUser(): Promise<AuthUser> {
    const { data } = await api.get<AuthResponse>("/auth/me");
    return data.user;
}

export async function logoutUser(): Promise<void> {
    await api.post("/auth/logout");
}
