import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    ShieldCheck,
    TrendingUp,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

interface LoginFormValues {
    email: string;
    password: string;
}

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

        return response?.data?.message || "Login failed. Please try again.";
    }

    return "Unable to connect to the server. Please check your connection and try again.";
}

const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

export default function Login() {
    const { loginMutation } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);

    const params = new URLSearchParams(location.search);
    const redirect = params.get("redirect");

    const destination =
        redirect?.startsWith("/") && !redirect.startsWith("//")
            ? redirect
            : "/watchlist";

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>();

    const onSubmit = async (values: LoginFormValues) => {
        try {
            await loginMutation.mutateAsync(values);
            navigate(destination, { replace: true });
        } catch (error: unknown) {
            console.error("Login failed:", error);
            // The mutation error is displayed below.
        }
    };

    return (
        <main className="relative min-h-screen overflow-hidden bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
            {/* Background decorations */}
            <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />

            {/* Centered card — matches Register page */}
            <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
                <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 lg:grid-cols-2">
                    {/* Left branding panel */}
                    <section className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex xl:p-12">
                        {/* Decorative elements */}
                        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />

                        <Link
                            to="/"
                            className="relative z-10 inline-flex w-fit items-center gap-3"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                                <TrendingUp size={23} />
                            </div>
                            <span className="text-xl font-bold tracking-tight">
                                AI Stock
                                <span className="text-blue-400">
                                    {" "}Intelligence
                                </span>
                            </span>
                        </Link>

                        <div className="relative z-10 max-w-xl">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-blue-200">
                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                Your market insights, all in one place
                            </div>

                            <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
                                Welcome back to
                                <span className="mt-2 block text-blue-400">
                                    smarter investing.
                                </span>
                            </h1>

                            <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                                Explore stock performance, understand market
                                trends, and get AI-powered insights to make more
                                informed investment decisions.
                            </p>

                            <div className="mt-10 space-y-5">
                                {[
                                    "Track your favourite stocks",
                                    "Explore historical market performance",
                                    "Get AI-powered stock analysis",
                                ].map((feature) => (
                                    <div
                                        key={feature}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
                                            <ShieldCheck size={15} />
                                        </div>
                                        <span className="text-sm text-slate-300">
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="relative z-10 text-xs text-slate-500">
                            Market insights powered by data and AI.
                        </p>
                    </section>

                    {/* Right login panel */}
                    <section className="p-6 sm:p-10 xl:p-12">
                        <div className="mx-auto w-full max-w-md">
                            {/* Mobile branding */}
                            <Link
                                to="/"
                                className="mb-8 flex items-center gap-3 lg:hidden"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                                    <TrendingUp size={22} />
                                </div>
                                <span className="text-lg font-bold text-slate-900">
                                    AI Stock
                                    <span className="text-blue-600">
                                        {" "}Intelligence
                                    </span>
                                </span>
                            </Link>

                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
                            >
                                <ArrowLeft size={16} />
                                Back to Dashboard
                            </Link>

                            <div className="mb-8 mt-8">
                                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                                    <LockKeyhole size={26} />
                                </div>

                                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                    Welcome back
                                </h2>

                                <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                                    Sign in to access your watchlist and
                                    personalized stock insights.
                                </p>
                            </div>

                            <form
                                onSubmit={handleSubmit(onSubmit)}
                                className="space-y-5"
                                noValidate
                            >
                                {/* Email */}
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Email address
                                    </label>

                                    <div className="relative">
                                        <Mail
                                            size={18}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                        <input
                                            id="email"
                                            type="email"
                                            autoComplete="email"
                                            placeholder="you@example.com"
                                            aria-invalid={Boolean(errors.email)}
                                            className={`${inputClass} ${errors.email
                                                    ? "border-red-400 focus:border-red-400 focus:ring-red-400/10"
                                                    : ""
                                                }`}
                                            {...register("email", {
                                                required: "Email is required",
                                                pattern: {
                                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                    message:
                                                        "Enter a valid email address",
                                                },
                                            })}
                                        />
                                    </div>

                                    {errors.email && (
                                        <p className="mt-2 text-xs font-medium text-red-600">
                                            {errors.email.message}
                                        </p>
                                    )}
                                </div>

                                {/* Password */}
                                <div>
                                    <label
                                        htmlFor="password"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Password
                                    </label>

                                    <div className="relative">
                                        <LockKeyhole
                                            size={18}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            placeholder="Enter your password"
                                            aria-invalid={Boolean(errors.password)}
                                            className={`${inputClass} ${errors.password
                                                    ? "border-red-400 focus:border-red-400 focus:ring-red-400/10"
                                                    : ""
                                                }`}
                                            {...register("password", {
                                                required: "Password is required",
                                            })}
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword((previous) => !previous)
                                            }
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                        >
                                            {showPassword ? (
                                                <EyeOff size={18} />
                                            ) : (
                                                <Eye size={18} />
                                            )}
                                        </button>
                                    </div>

                                    {errors.password && (
                                        <p className="mt-2 text-xs font-medium text-red-600">
                                            {errors.password.message}
                                        </p>
                                    )}
                                </div>

                                {/* API error */}
                                {loginMutation.isError && (
                                    <div
                                        role="alert"
                                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
                                    >
                                        {getErrorMessage(loginMutation.error)}
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loginMutation.isPending}
                                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loginMutation.isPending
                                        ? "Signing in..."
                                        : "Sign In"}

                                    {!loginMutation.isPending && (
                                        <ArrowRight
                                            size={18}
                                            className="transition-transform group-hover:translate-x-1"
                                        />
                                    )}
                                </button>
                            </form>

                            <div className="my-7 flex items-center gap-4">
                                <div className="h-px flex-1 bg-slate-200" />
                                <span className="text-xs text-slate-400">
                                    NEW TO AI STOCK?
                                </span>
                                <div className="h-px flex-1 bg-slate-200" />
                            </div>

                            <p className="text-center text-sm text-slate-500">
                                Don't have an account?{" "}
                                <Link
                                    to="/register"
                                    className="font-semibold text-blue-600 transition hover:text-blue-700"
                                >
                                    Create an account
                                </Link>
                            </p>

                            <p className="mt-8 text-center text-xs leading-5 text-slate-400">
                                For informational purposes only. AI-generated
                                stock insights are not financial advice.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}