const browser = typeof window !== 'undefined';

function loadAuth() {
	if (browser) {
		const stored = localStorage.getItem('authUser');
		if (stored) {
			try {
				const user = JSON.parse(stored);
				return { isLoggedIn: true, user };
			} catch (e) {
				// ignore invalid cache
			}
		}
	}
	return { isLoggedIn: false, user: /** @type {any} */ (null) };
}

export const authState = $state(loadAuth());

/**
 * @param {Partial<{id: string, name: string, email: string, role: string, hasData: boolean}> | any} [userOverrides]
 */
export function login(userOverrides) {
	authState.isLoggedIn = true;
	if (userOverrides) {
		authState.user = /** @type {any} */ ({ ...authState.user, ...userOverrides });
		if (browser) {
			localStorage.setItem('authUser', JSON.stringify(authState.user));
		}
	}
}

export function logout() {
	authState.isLoggedIn = false;
	authState.user = /** @type {any} */ (null);
	if (browser) {
		localStorage.removeItem('authUser');
	}
}
