/**
 * Apollo Client + Chat WebSocket
 * - GraphQL: HTTP (query/mutation) — loyihada subscription ishlatilmaydi
 * - Chat: alohida native WebSocket (socketVar orqali Chat.tsx ga ulanadi)
 */
import { useMemo } from 'react';
import { ApolloClient, ApolloLink, InMemoryCache, from, NormalizedCacheObject } from '@apollo/client';
import createUploadLink from 'apollo-upload-client/public/createUploadLink.js';
import { onError } from '@apollo/client/link/error';
import { getJwtToken } from '../libs/auth';
import { TokenRefreshLink } from 'apollo-link-token-refresh';
import { sweetErrorAlert } from '../libs/sweetAlert';
import { socketVar } from './store';

let apolloClient: ApolloClient<NormalizedCacheObject>;

function getHeaders() {
	const headers = {} as HeadersInit;
	const token = getJwtToken();
	// @ts-ignore
	if (token) headers['Authorization'] = `Bearer ${token}`;
	return headers;
}

const tokenRefreshLink = new TokenRefreshLink({
	accessTokenField: 'accessToken',
	isTokenValidOrUndefined: () => true,
	// @ts-ignore
	fetchAccessToken: () => null,
});

/** Chat uchun WebSocket URL (token query param orqali backend auth qiladi) */
function getChatWebSocketUrl(): string {
	const wsBase = process.env.REACT_APP_API_WS || 'ws://127.0.0.1:3007';
	const token = getJwtToken();
	if (!token) return wsBase;
	return `${wsBase}?token=${encodeURIComponent(token)}`;
}

/**
 * Live chat socket — Apollo subscription emas, to'g'ridan-to'g'ri Nest SocketGateway ga ulanadi.
 * MUHIM: oldingi kodda socket faqat GraphQL subscription paytida ochilardi;
 * loyihada subscription yo'q → chat hech qachon ulanmas edi.
 */
export function initChatWebSocket(forceReconnect = false) {
	if (typeof window === 'undefined') return;

	const current = socketVar();
	if (!forceReconnect && current && (current.readyState === WebSocket.OPEN || current.readyState === WebSocket.CONNECTING)) {
		return;
	}

	if (current) {
		try {
			current.close();
		} catch {
			/* ignore */
		}
	}

	const socket = new WebSocket(getChatWebSocketUrl());
	socketVar(socket);

	socket.onopen = () => {
		console.log('[Chat] WebSocket connected');
	};

	socket.onerror = (error) => {
		console.error('[Chat] WebSocket error:', error);
	};

	socket.onclose = () => {
		console.log('[Chat] WebSocket closed');
	};
}

function createIsomorphicLink() {
	// @ts-ignore — apollo-upload-client default export
	const uploadLink = new createUploadLink({
		uri: process.env.REACT_APP_API_GRAPHQL_URL || 'http://localhost:3007/graphql',
	});

	if (typeof window === 'undefined') {
		return uploadLink;
	}

	initChatWebSocket();

	const authLink = new ApolloLink((operation, forward) => {
		operation.setContext(({ headers = {} }) => ({
			headers: {
				...headers,
				...getHeaders(),
			},
		}));
		return forward(operation);
	});

	const errorLink = onError(({ graphQLErrors, networkError }) => {
		if (graphQLErrors) {
			graphQLErrors.forEach(({ message, locations, path }) => {
				console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
				if (!message.includes('input')) sweetErrorAlert(message);
			});
		}
		if (networkError) console.log(`[Network error]: ${networkError}`);
	});

	return from([errorLink, tokenRefreshLink, authLink.concat(uploadLink)]);
}

function createApolloClient() {
	return new ApolloClient({
		ssrMode: typeof window === 'undefined',
		link: createIsomorphicLink(),
		cache: new InMemoryCache(),
		resolvers: {},
	});
}

export function initializeApollo(initialState = null) {
	const _apolloClient = apolloClient ?? createApolloClient();
	if (initialState) _apolloClient.cache.restore(initialState);
	if (typeof window === 'undefined') return _apolloClient;
	if (!apolloClient) apolloClient = _apolloClient;

	return _apolloClient;
}

export function useApollo(initialState: any) {
	return useMemo(() => initializeApollo(initialState), [initialState]);
}
