import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/app/(main)/login/action";

interface LoginFormProps extends React.ComponentProps<"div"> {
	redirectTo?: string;
	error?: string;
}

export function LoginForm({
	className,
	redirectTo,
	error,
	...props
}: LoginFormProps) {
	const getErrorMessage = (errorType: string | undefined) => {
		switch (errorType) {
			case "auth_failed":
				return "Authentication failed. Please try again.";
			case "no_session":
				return "Session expired. Please login again.";
			default:
				return null;
		}
	};

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader>
					<CardTitle>Login</CardTitle>
					<CardDescription>
						Enter your email below to login to your account.
					</CardDescription>
					{error && (
						<div className="mt-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
							{getErrorMessage(error)}
						</div>
					)}
				</CardHeader>
				<CardContent>
					<form className="flex flex-col gap-6">
						{redirectTo && (
							<input type="hidden" name="redirectTo" value={redirectTo} />
						)}
						<div className="grid gap-3">
							<Label htmlFor="username">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="email@example.com"
								required
							/>
						</div>
						<div className="grid gap-3">
							<Label htmlFor="password">Password</Label>
							<Input id="password" name="password" type="password" required />
						</div>
						<div className="flex flex-col gap-3">
							<Button formAction={login}>Login</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
