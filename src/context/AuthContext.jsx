import { createContext, useContext, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, { clearStoredAuth, getApiErrorMessage, getStoredAuth, persistAuth } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState(getStoredAuth);
  const token = authState?.token ?? null;
  const storedUser = authState?.user ?? null;

  const meQuery = useQuery({
    queryKey: ['auth', 'me', token],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      return response.data.user;
    },
    enabled: Boolean(token),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    },
  });

  useEffect(() => {
    if (!authState) {
      clearStoredAuth();
      return;
    }

    persistAuth(authState);
  }, [authState]);

  useEffect(() => {
    if (!meQuery.data || !authState) {
      return;
    }

    setAuthState((currentAuthState) => {
      if (!currentAuthState) {
        return currentAuthState;
      }

      return {
        ...currentAuthState,
        user: meQuery.data,
      };
    });
  }, [authState, meQuery.data]);

  useEffect(() => {
    if (!token || !meQuery.isError) {
      return;
    }

    clearStoredAuth();
    setAuthState(null);
    queryClient.clear();
  }, [meQuery.isError, queryClient, token]);

  const login = async (credentials) => {
    try {
      const nextAuthState = await loginMutation.mutateAsync({
        ...credentials,
        username: credentials.username.trim(),
      });

      setAuthState(nextAuthState);
      persistAuth(nextAuthState);
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });

      return {
        success: true,
        user: nextAuthState.user,
      };
    } catch (error) {
      return {
        success: false,
        error: getApiErrorMessage(
          error,
          'Unable to sign in right now. Please check your credentials and try again.',
        ),
      };
    }
  };

  const logout = () => {
    clearStoredAuth();
    setAuthState(null);
    queryClient.clear();
  };

  const value = {
    user: meQuery.data ?? storedUser,
    login,
    logout,
    token,
    isAuthenticated: Boolean(token && (meQuery.data ?? storedUser)),
    isAuthLoading: Boolean(token) && meQuery.isLoading,
    isLoginPending: loginMutation.isPending,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
