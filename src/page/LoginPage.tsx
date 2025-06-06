import { Alert, alpha, Box, Button, Container, Stack, Typography, useTheme } from "@mui/material"
import { useGoogleLogin } from "@react-oauth/google";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { googleSessionAtom } from "../atom/googlesession";
import { LoginResp } from "../client/google";

function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
        </svg>
    );
}

export const LoginPage = () => {
    const theme = useTheme();
    const [loginError, setLoginError] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);
    const setGoogleSession = useSetAtom(googleSessionAtom);
    const handleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const loginResp: LoginResp = await fetch('/api/auth/login?' + new URLSearchParams({ code: tokenResponse.code }), { method: 'POST' })
                    .then(res => res.json());
                const session = { accessToken: loginResp.access_token };
                setGoogleSession(session);
            } finally {
                setLoading(false);
            }
        },
        onError: (errorResponse) => {
            setLoading(false);
            setLoginError(errorResponse.toString())
        },
        onNonOAuthError: (error) => {
            setLoading(false);
            setLoginError(error.type);
        },
        flow: 'auth-code',
        scope: ['https://www.googleapis.com/auth/drive.file'].join(' '),
    });
    return <Box
        sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
        }}
    >
        <Container component="main" maxWidth="xs">
            <Stack
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    p: 4,
                    gap: 1,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.grey[400], 0.4),
                    boxShadow: theme.shadows[4],
                }}
            >
                <Typography
                    variant="h5"
                    component="h1"
                    color="textPrimary"
                    sx={{
                        textAlign: 'center',
                        fontWeight: 600,
                    }}
                >
                    Pefin
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom textAlign="center">
                    Personal Finance App
                </Typography>
                <Box sx={{ width: '100%' }}>
                    <Stack spacing={1}>
                        {loginError ? <Alert severity="error">{loginError}</Alert> : null}
                        <form
                            onSubmit={async (event) => {
                                event.preventDefault();
                                setLoading(true);
                                setLoginError(undefined);
                                handleLogin();
                            }}
                        >
                            <Button
                                variant="outlined"
                                type="submit"
                                fullWidth
                                size="large"
                                disableElevation
                                name="provider"
                                color="inherit"
                                loading={loading}
                                value="google"
                                startIcon={GoogleIcon()}
                                sx={{
                                    textTransform: 'capitalize',
                                }}
                            >
                                <span>Accedi con Google</span>
                            </Button>
                        </form>
                    </Stack>
                </Box>
            </Stack>
        </Container>
    </Box>;
}