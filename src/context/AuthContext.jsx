// import { createContext, useContext, useEffect, useState } from "react";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import { doc, getDoc } from "firebase/firestore";
// import { auth, db } from "../lib/firebase";

// const AuthCtx = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null); //firebase user
//   const [role, setRole] = useState(null); // 'admin','user' o null
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, async (fbUser) => {
//       if (!fbUser) {
//         setUser(null);
//         setRole(null);
//         setLoading(false);
//         return;
//       }

//       //check role
//       try {
//         const snap = await getDoc(doc(db, "users", fbUser.uid));
//         const data = snap.data();
//         setUser(fbUser);
//         setRole(data?.role ?? "user");
//       } catch {
//         setRole("user");
//       } finally {
//         setLoading(false);
//       }
//     });
//     return unsub;
//   }, []);

//   const logout = () => signOut(auth);

//   return (
//     <AuthCtx.Provider value={{ user, role, loading, logout }}>
//       {children}
//     </AuthCtx.Provider>
//   );
// }

// export const useAuth = () => useContext(AuthCtx);

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const AuthCtx = createContext(null);

// Sign the admin out after this much time without any interaction
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // firebase user (only set once role is known)
  const [role, setRole] = useState(null); // 'admin' | 'user' | null
  const [loading, setLoading] = useState(true);
  const idleTimer = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      // Keep "loading" true while the role is being fetched so routes never see
      // a half-signed-in state (this caused the login page to bounce / get stuck).
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", fbUser.uid));
        if (!snap.exists()) {
          // Auth account exists but has no profile document: not a valid admin.
          setUser(fbUser);
          setRole("user");
        } else {
          setUser(fbUser);
          setRole(snap.data()?.role ?? "user");
        }
      } catch (err) {
        console.error("Could not verify account role:", err);
        await signOut(auth);
        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  // Auto sign-out after inactivity (only while someone is signed in)
  useEffect(() => {
    if (!user) return;
    const reset = () => {
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => signOut(auth), IDLE_TIMEOUT_MS);
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(idleTimer.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [user]);

  const logout = () => signOut(auth);

  return (
    <AuthCtx.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
