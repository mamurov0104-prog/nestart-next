import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar, Box, Stack } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import MarkChatUnreadIcon from '@mui/icons-material/MarkChatUnread';
import { useRouter } from 'next/router';
import ScrollableFeed from 'react-scrollable-feed';
import { RippleBadge } from '../../scss/MaterialTheme/styled';
import { initChatWebSocket } from '../../apollo/client';
import { socketVar, userVar } from '../../apollo/store';
import { useReactiveVar } from '@apollo/client';
import { Member } from '../types/member/member';
import { Messages, REACT_APP_API_URL } from '../config';
import { sweetErrorAlert } from '../sweetAlert';

interface MessagePayload {
	event: string;
	text: string;
	memberData: Member | null;
}

interface InfoPayload {
	event: string;
	totalClients: number;
	memberData: Member | null;
	action: string;
}

const Chat = () => {
	const chatContentRef = useRef<HTMLDivElement>(null);
	const [messagesList, setMessagesList] = useState<MessagePayload[]>([]);
	const [onlineUsers, setOnlineUsers] = useState<number>(0);
	const [message, setMessage] = useState<string>('');
	const [open, setOpen] = useState(false);
	const [openButton, setOpenButton] = useState(false);
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const socket = useReactiveVar(socketVar);

	/** Socket ulanishi va xabarlarni qabul qilish */
	useEffect(() => {
		initChatWebSocket();
	}, []);

	useEffect(() => {
		if (!socket) return;

		const onMessage = (msg: MessageEvent) => {
			try {
				const data = JSON.parse(msg.data as string);
				switch (data.event) {
					case 'info': {
						const newInfo = data as InfoPayload;
						setOnlineUsers(newInfo.totalClients ?? 0);
						break;
					}
					case 'getMessages': {
						const list = (data.list as MessagePayload[]) || [];
						setMessagesList(list);
						break;
					}
					case 'message': {
						const newMessage = data as MessagePayload;
						setMessagesList((prev) => [...prev, newMessage]);
						break;
					}
					default:
						break;
				}
			} catch (err) {
				console.error('[Chat] Failed to parse message:', err);
			}
		};

		socket.addEventListener('message', onMessage);
		return () => socket.removeEventListener('message', onMessage);
	}, [socket]);

	useEffect(() => {
		const timeoutId = setTimeout(() => setOpenButton(true), 100);
		return () => clearTimeout(timeoutId);
	}, []);

	useEffect(() => {
		setOpenButton(false);
	}, [router.pathname]);

	/** Login bo'lganda token bilan qayta ulanish */
	useEffect(() => {
		if (user?._id) {
			initChatWebSocket(true);
		}
	}, [user?._id]);

	const handleOpenChat = () => {
		setOpen((prevState) => !prevState);
	};

	const getInputMessageHandler = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setMessage(e.target.value);
	}, []);

	const getKeyHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			onClickHandler();
		}
	};

	const onClickHandler = () => {
		if (!message.trim()) {
			sweetErrorAlert(Messages.error4);
			return;
		}

		if (!socket || socket.readyState !== WebSocket.OPEN) {
			sweetErrorAlert('Chat is connecting. Please try again in a moment.');
			initChatWebSocket(true);
			return;
		}

		// NestJS @SubscribeMessage('message') format
		socket.send(JSON.stringify({ event: 'message', data: message.trim() }));
		setMessage('');
	};

	return (
		<Stack className="chatting">
			{openButton ? (
				<button className="chat-button" onClick={handleOpenChat}>
					{open ? <CloseFullscreenIcon /> : <MarkChatUnreadIcon />}
				</button>
			) : null}
			<Stack className={`chat-frame ${open ? 'open' : ''}`}>
				<Box className={'chat-top'} component={'div'}>
					<div style={{ fontFamily: 'Nunito' }}>Online Chat</div>
					<RippleBadge style={{ margin: '-18px 0 0 21px' }} badgeContent={onlineUsers} />
				</Box>
				<Box className={'chat-content'} id="chat-content" ref={chatContentRef} component={'div'}>
					<ScrollableFeed>
						<Stack className={'chat-main'}>
							<Box flexDirection={'row'} style={{ display: 'flex' }} sx={{ m: '10px 0px' }} component={'div'}>
								<div className={'welcome'}>Welcome to Live chat!</div>
							</Box>
							{messagesList.map((ele: MessagePayload, index: number) => {
								const { text, memberData } = ele;
								const memberImage = memberData?.memberImage
									? `${REACT_APP_API_URL}/${memberData.memberImage}`
									: '/img/profile/defaultUser.svg';
								const isMine = memberData?._id && user?._id && memberData._id === user._id;

								return isMine ? (
									<Box
										key={`${memberData?._id}-${index}-${text}`}
										component={'div'}
										flexDirection={'row'}
										style={{ display: 'flex' }}
										alignItems={'flex-end'}
										justifyContent={'flex-end'}
										sx={{ m: '10px 0px' }}
									>
										<div className={'msg-right'}>{text}</div>
									</Box>
								) : (
									<Box
										key={`${memberData?._id ?? 'guest'}-${index}-${text}`}
										flexDirection={'row'}
										style={{ display: 'flex' }}
										sx={{ m: '10px 0px' }}
										component={'div'}
									>
										<Avatar alt={memberData?.memberNick ?? 'Guest'} src={memberImage} />
										<div className={'msg-left'}>{text}</div>
									</Box>
								);
							})}
						</Stack>
					</ScrollableFeed>
				</Box>
				<Box className={'chat-bott'} component={'div'}>
					<input
						type={'text'}
						name={'message'}
						className={'msg-input'}
						placeholder={'Type message'}
						value={message}
						onChange={getInputMessageHandler}
						onKeyDown={getKeyHandler}
					/>
					<button className={'send-msg-btn'} onClick={onClickHandler}>
						<SendIcon style={{ color: '#fff' }} />
					</button>
				</Box>
			</Stack>
		</Stack>
	);
};

export default Chat;
