const isUnauthorized = (error) => error?.response?.status === 401

export const createFirebaseBackendLogin = (api) => async (firebaseUser) => {
  const token = await firebaseUser.getIdToken(true)
  await api.post("/api/auth/login", { token })
}

export const createSessionRestorer = ({ getCurrentUser, loginWithFirebaseUser }) => {
  const inFlightByUid = new Map()

  return (firebaseUser) => {
    const key = firebaseUser?.uid || "anonymous"
    const existing = inFlightByUid.get(key)
    if (existing) return existing

    const restoration = (async () => {
      try {
        return await getCurrentUser()
      } catch (error) {
        if (!isUnauthorized(error)) throw error
        if (!firebaseUser) return null
      }

      await loginWithFirebaseUser(firebaseUser)
      // Confirm the cookie made it through the Auth service, Gateway and Vercel
      // rewrite before React considers this user signed in.
      return getCurrentUser()
    })()

    inFlightByUid.set(key, restoration)
    restoration.finally(() => {
      if (inFlightByUid.get(key) === restoration) inFlightByUid.delete(key)
    }).catch(() => {})
    return restoration
  }
}
