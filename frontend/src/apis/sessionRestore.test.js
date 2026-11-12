import test from "node:test"
import assert from "node:assert/strict"
import { createFirebaseBackendLogin, createSessionRestorer } from "./sessionRestore.js"

const httpError = (status) => ({ response: { status } })

test("uses an existing backend session without logging in again", async () => {
  let loginCalls = 0
  const restore = createSessionRestorer({
    getCurrentUser: async () => ({ success: true, user: { _id: "user-1" } }),
    loginWithFirebaseUser: async () => { loginCalls += 1 },
  })

  assert.equal((await restore({ uid: "firebase-user-1" })).user._id, "user-1")
  assert.equal(loginCalls, 0)
})

test("repairs one unauthorized session and verifies it again", async () => {
  let reads = 0
  let logins = 0
  const restore = createSessionRestorer({
    getCurrentUser: async () => {
      reads += 1
      if (reads === 1) throw httpError(401)
      return { success: true, user: { _id: "user-2" } }
    },
    loginWithFirebaseUser: async (user) => {
      logins += 1
      assert.equal(user.uid, "firebase-user-2")
    },
  })

  assert.equal((await restore({ uid: "firebase-user-2" })).user._id, "user-2")
  assert.equal(reads, 2)
  assert.equal(logins, 1)
})

test("does not probe the backend when there is no Firebase user", async () => {
  let reads = 0
  let loginCalls = 0
  const restore = createSessionRestorer({
    getCurrentUser: async () => { reads += 1; throw httpError(401) },
    loginWithFirebaseUser: async () => { loginCalls += 1 },
  })

  assert.equal(await restore(null), null)
  assert.equal(reads, 0)
  assert.equal(loginCalls, 0)
})

test("establishes popup login directly and verifies the issued backend session", async () => {
  const calls = []
  const restore = createSessionRestorer({
    getCurrentUser: async () => {
      calls.push("me")
      return { success: true, user: { _id: "user-popup" } }
    },
    loginWithFirebaseUser: async () => { calls.push("login") },
  })

  const result = await restore.establish({ uid: "firebase-popup" })
  assert.deepEqual(calls, ["login", "me"])
  assert.equal(result.user._id, "user-popup")
})

test("does not turn backend outages into logout or trigger Firebase login", async () => {
  let loginCalls = 0
  const unavailable = httpError(503)
  const restore = createSessionRestorer({
    getCurrentUser: async () => { throw unavailable },
    loginWithFirebaseUser: async () => { loginCalls += 1 },
  })

  await assert.rejects(restore({ uid: "firebase-user-3" }), (error) => error === unavailable)
  assert.equal(loginCalls, 0)
})

test("does not retry login after a network failure", async () => {
  let loginCalls = 0
  const networkError = new Error("network unavailable")
  const restore = createSessionRestorer({
    getCurrentUser: async () => { throw networkError },
    loginWithFirebaseUser: async () => { loginCalls += 1 },
  })

  await assert.rejects(restore({ uid: "firebase-user-4" }), (error) => error === networkError)
  assert.equal(loginCalls, 0)
})

test("deduplicates concurrent session restoration for the same Firebase user", async () => {
  let reads = 0
  let resolveRead
  const read = new Promise((resolve) => { resolveRead = resolve })
  const restore = createSessionRestorer({
    getCurrentUser: async () => {
      reads += 1
      return read
    },
    loginWithFirebaseUser: async () => assert.fail("login must not be called"),
  })
  const firebaseUser = { uid: "firebase-user-5" }

  const first = restore(firebaseUser)
  const second = restore(firebaseUser)
  assert.equal(reads, 1)
  resolveRead({ success: true, user: { _id: "user-5" } })
  assert.deepEqual(await first, await second)
})

test("sends a freshly refreshed Firebase ID token using the existing login contract", async () => {
  let refreshRequested = false
  let request
  const login = createFirebaseBackendLogin({
    post: async (...args) => { request = args },
  })

  await login({
    getIdToken: async (forceRefresh) => {
      refreshRequested = forceRefresh
      return "fresh-firebase-id-token"
    },
  })
  assert.equal(refreshRequested, true)
  assert.deepEqual(request, ["/api/auth/login", { token: "fresh-firebase-id-token" }])
})
