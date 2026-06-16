import { type ReactNode } from 'react';
import { AuthContext, useProvideAuth } from '~/hooks/useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useProvideAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
