import { debugSession } from "@/utils/debug-session";

export default async function TestSessionPage() {
    const { session, user, sessionError, userError } = await debugSession();

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Session Debug Page</h1>

            <div className="space-y-4">
                <div className="p-4 border rounded">
                    <h2 className="font-semibold">Session Status</h2>
                    <p>Has Session: {session ? "Yes" : "No"}</p>
                    <p>Session Error: {sessionError ? JSON.stringify(sessionError) : "None"}</p>
                    {session && (
                        <div>
                            <p>Expires At: {session.expires_at}</p>
                            <p>Access Token: {session.access_token ? "Present" : "Missing"}</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border rounded">
                    <h2 className="font-semibold">User Status</h2>
                    <p>Has User: {user ? "Yes" : "No"}</p>
                    <p>User Error: {userError ? JSON.stringify(userError) : "None"}</p>
                    {user && (
                        <div>
                            <p>Email: {user.email}</p>
                            <p>ID: {user.id}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}