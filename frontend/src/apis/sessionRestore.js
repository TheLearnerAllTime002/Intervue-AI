const isUnauthorized = (error) => error?.response?.status === 401

export const createFirebaseBackendLogin = (api) => async (firebaseUser) => {
  const token = await firebaseUser.getIdToken(true)
  await api.post("/api/auth/login", { token })
}

export const createSessionRestorer = ({ getCurrentUser, loginWithFirebaseUser }) => {
  const inFlightByUid = new Map()

  const runOncePerUser = (firebaseUser, action) => {
    const key = firebaseUser.uid
    const existing = inFlightByUid.get(key)
    if (existing) return existing

    const operation = action()
    inFlightByUid.set(key, operation)
    operation.finally(() => {
      if (inFlightByUid.get(key) === operation) inFlightByUid.delete(key)
    }).catch(() => {})
    return operation
  }

  const restore = (firebaseUser) => {
    // An anonymous page load has no app identity to restore. Avoid probing the
    // protected endpoint and generating an expected 401 in the browser console.
    if (!firebaseUser?.uid) return Promise.resolve(null)

    return runOncePerUser(firebaseUser, async () => {
      try {
        return await getCurrentUser()
      } catch (error) {
        if (!isUnauthorized(error)) throw error
      }

      await loginWithFirebaseUser(firebaseUser)
      // Confirm the cookie made it through the Auth service, Gateway and Vercel
      // rewrite before React considers this user signed in.
      return getCurrentUser()
    })
  }

  restore.establish = (firebaseUser) => {
    if (!firebaseUser?.uid) return Promise.resolve(null)
    return runOncePerUser(firebaseUser, async () => {
      await loginWithFirebaseUser(firebaseUser)
      return getCurrentUser()
    })
  }

  return restore
}
