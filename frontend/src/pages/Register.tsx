
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    Phone,
    ShieldCheck,
    TrendingUp,
    User,
    UserPlus,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import type { RegisterPayload } from "../services/authService";

type RegisterFormValues = RegisterPayload & {
    confirmPassword: string;
};

function getErrorMessage(error: unknown): string {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error
    ) {
        const response = (
            error as {
                response?: { data?: { message?: string } };
            }
        ).response;

        return response?.data?.message || "Registration failed.";
    }

    return "Unable to connect to the server. Please try again.";
}

const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const labelClass =
    "mb-2 block text-sm font-semibold text-slate-700";

export default function Register() {
    const { registerMutation } = useAuth();
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterFormValues>();

    const password = watch("password", "");

    const onSubmit = async (values: RegisterFormValues) => {
        try {
            const payload = {
                firstName: values.firstName,
                lastName: values.lastName,
                phoneNumber: values.phoneNumber,
                email: values.email,
                password: values.password,
            };

            await registerMutation.mutateAsync(payload);
            navigate("/login", { replace: true });
        } catch (error: unknown) {
            console.error("Registration failed:", error);
        }
    };

    return (
        <main className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
            {/* Background decoration */}
            <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />

            <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
                <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 lg:grid-cols-2">
                    {/* Left branding panel */}
                    <section className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex xl:p-12">
                        <div className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

                        <div className="relative">
                            <Link
                                to="/"
                                className="inline-flex items-center gap-3"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20">
                                    <TrendingUp size={25} />
                                </div>

                                <div>
                                    <p className="text-lg font-bold tracking-tight">
                                        AI Stock Intelligence
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Indian market insights
                                    </p>
                                </div>
                            </Link>

                            <div className="mt-20">
                                <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-semibold text-blue-300">
                                    <TrendingUp size={14} />
                                    Smarter stock research
                                </div>

                                <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
                                    Make informed
                                    <span className="block text-blue-400">
                                        market decisions.
                                    </span>
                                </h1>

                                <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
                                    Explore stock fundamentals, track
                                    market movements, compare companies
                                    and understand financial data with
                                    AI-powered insights.
                                </p>
                            </div>

                            <div className="mt-10 space-y-4">
                                {[
                                    "Save your favourite stocks",
                                    "Explore fundamentals and historical data",
                                    "Get AI-powered stock analysis",
                                ].map((feature) => (
                                    <div
                                        key={feature}
                                        className="flex items-center gap-3 text-sm text-slate-300"
                                    >
                                        <CheckCircle2
                                            size={18}
                                            className="shrink-0 text-emerald-400"
                                        />
                                        {feature}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative mt-12 flex items-center gap-2 text-xs text-slate-500">
                            <ShieldCheck size={16} />
                            Your account, your personal watchlist.
                        </div>
                    </section>

                    {/* Registration form */}
                    <section className="p-6 sm:p-10 xl:p-12">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                        >
                            <ArrowLeft size={16} />
                            Back to Dashboard
                        </Link>

                        <div className="mb-8 mt-8">
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 lg:hidden">
                                <TrendingUp size={25} />
                            </div>

                            <p className="text-sm font-semibold text-blue-600">
                                GET STARTED FOR FREE
                            </p>

                            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                                Create your account
                            </h2>

                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                Enter your details to create your account
                                and start building your stock watchlist.
                            </p>
                        </div>

                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="space-y-5"
                        >
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="firstName"
                                        className={labelClass}
                                    >
                                        First name
                                    </label>

                                    <div className="relative">
                                        <User
                                            size={17}
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                        />
                                        <input
                                            id="firstName"
                                            autoComplete="given-name"
                                            placeholder="First name"
                                            aria-invalid={Boolean(errors.firstName)}
                                            className={inputClass}
                                            {...register("firstName", {
                                                required: "First name is required",
                                                minLength: {
                                                    value: 2,
                                                    message: "Enter at least 2 characters",
                                                },
                                            })}
                                        />
                                    </div>

                                    {errors.firstName && (
                                        <p className="mt-1.5 text-xs text-red-600">
                                            {errors.firstName.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="lastName"
                                        className={labelClass}
                                    >
                                        Last name
                                    </label>

                                    <div className="relative">
                                        <User
                                            size={17}
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                        />
                                        <input
                                            id="lastName"
                                            autoComplete="family-name"
                                            placeholder="Last name"
                                            aria-invalid={Boolean(errors.lastName)}
                                            className={inputClass}
                                            {...register("lastName", {
                                                required: "Last name is required",
                                                minLength: {
                                                    value: 2,
                                                    message: "Enter at least 2 characters",
                                                },
                                            })}
                                        />
                                    </div>

                                    {errors.lastName && (
                                        <p className="mt-1.5 text-xs text-red-600">
                                            {errors.lastName.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="phoneNumber"
                                    className={labelClass}
                                >
                                    Phone number
                                </label>

                                <div className="relative">
                                    <Phone
                                        size={17}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        id="phoneNumber"
                                        type="tel"
                                        autoComplete="tel"
                                        placeholder="+91 98765 43210"
                                        aria-invalid={Boolean(errors.phoneNumber)}
                                        className={inputClass}
                                        {...register("phoneNumber", {
                                            required: "Phone number is required",
                                            pattern: {
                                                value: /^[+]?[\d\s()-]{7,20}$/,
                                                message: "Enter a valid phone number",
                                            },
                                        })}
                                    />
                                </div>

                                {errors.phoneNumber && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {errors.phoneNumber.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className={labelClass}
                                >
                                    Email address
                                </label>

                                <div className="relative">
                                    <Mail
                                        size={17}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        aria-invalid={Boolean(errors.email)}
                                        className={inputClass}
                                        {...register("email", {
                                            required: "Email is required",
                                            pattern: {
                                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                message: "Enter a valid email address",
                                            },
                                        })}
                                    />
                                </div>

                                {errors.email && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className={labelClass}
                                >
                                    Password
                                </label>

                                <div className="relative">
                                    <LockKeyhole
                                        size={17}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        placeholder="At least 8 characters"
                                        aria-invalid={Boolean(errors.password)}
                                        className={`${inputClass} pr-12`}
                                        {...register("password", {
                                            required: "Password is required",
                                            minLength: {
                                                value: 8,
                                                message: "Password must be at least 8 characters",
                                            },
                                        })}
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword((current) => !current)
                                        }
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                                    >
                                        {showPassword ? (
                                            <EyeOff size={17} />
                                        ) : (
                                            <Eye size={17} />
                                        )}
                                    </button>
                                </div>

                                {errors.password && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className={labelClass}
                                >
                                    Confirm password
                                </label>

                                <div className="relative">
                                    <LockKeyhole
                                        size={17}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        id="confirmPassword"
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        autoComplete="new-password"
                                        placeholder="Re-enter your password"
                                        aria-invalid={Boolean(errors.confirmPassword)}
                                        className={`${inputClass} pr-12`}
                                        {...register("confirmPassword", {
                                            required: "Please confirm your password",
                                            validate: (value) =>
                                                value === password ||
                                                "Passwords do not match",
                                        })}
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword((current) => !current)
                                        }
                                        aria-label={
                                            showConfirmPassword
                                                ? "Hide confirm password"
                                                : "Show confirm password"
                                        }
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff size={17} />
                                        ) : (
                                            <Eye size={17} />
                                        )}
                                    </button>
                                </div>

                                {errors.confirmPassword && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {errors.confirmPassword.message}
                                    </p>
                                )}
                            </div>

                            {registerMutation.isError && (
                                <div
                                    role="alert"
                                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                >
                                    {getErrorMessage(registerMutation.error)}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={registerMutation.isPending}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {registerMutation.isPending ? (
                                    "Creating your account..."
                                ) : (
                                    <>
                                        <UserPlus size={17} />
                                        Create Account
                                        <ArrowRight size={17} />
                                    </>
                                )}
                            </button>

                            <p className="text-center text-xs leading-5 text-slate-400">
                                By creating an account, you can save your
                                favourite stocks to your personal watchlist.
                            </p>
                        </form>

                        <div className="mt-7 border-t border-slate-100 pt-6 text-center">
                            <p className="text-sm text-slate-500">
                                Already have an account?{" "}
                                <Link
                                    to="/login"
                                    className="font-semibold text-blue-600 transition hover:text-blue-700"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
