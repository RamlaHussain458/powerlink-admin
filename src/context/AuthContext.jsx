import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); //firebase user
  const [role, setRole] = useState(null); // 'admin','user' o null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      //check role
      try {
        const snap = await getDoc(doc(db, "users", fbUser.uid));
        const data = snap.data();
        setUser(fbUser);
        setRole(data?.role ?? "user");
      } catch {
        setRole("user");
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthCtx.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
