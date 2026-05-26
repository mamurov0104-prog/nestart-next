/**
 * =============================================================================
 * MY PAGE — ASOSIY SAHIFA (SHELL / ROUTER)
 * =============================================================================
 * URL: /mypage?category=<bo'lim>
 *
 * Vazifa:
 * - Login qilgan foydalanuvchi uchun "shaxsiy kabinet" shell
 * - Chapda MyMenu, o'ngda category bo'yicha bitta child komponent
 * - Follow/like handlerlarni followers/followings childlarga prop orqali uzatish
 *
 * category qiymatlari:
 *   myProfile | addProperty | myProperties | myFavorites | recentlyVisited
 *   myArticles | writeArticle | followers | followings
 *
 * Ma'lumot manbai:
 * - userVar (Apollo reactive var) — JWT decode qilingan user
 * - Mutatsiyalar: SUBSCRIBE, UNSUBSCRIBE, LIKE_TARGET_MEMBER
 *
 * REVIEW / MUAMMOLAR:
 * - Mobil: faqat stub ("MY PAGE") — production uchun tayyor emas
 * - Auth: user._id bo'sh bo'lsa router.push('/') — yaxshi, lekin loading holati yo'q
 * - redirectToMemberPageHandler: o'z ID bo'lsa /mypage?memberId=... — memberId query ishlatilmaydi
 * - Typo: "Subscibed" / "Unsubscibed"
 * - category tipi `any` — enum yoki union type yaxshiroq
 * =============================================================================
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import { Stack } from '@mui/material';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import MyProperties from '../../libs/components/mypage/MyProperties';
import MyFavorites from '../../libs/components/mypage/MyFavorites';
import RecentlyVisited from '../../libs/components/mypage/RecentlyVisited';
import AddProperty from '../../libs/components/mypage/AddNewProperty';
import MyProfile from '../../libs/components/mypage/MyProfile';
import MyArticles from '../../libs/components/mypage/MyArticles';
import { useMutation, useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import MyMenu from '../../libs/components/mypage/MyMenu';
import WriteArticle from '../../libs/components/mypage/WriteArticle';
import MemberFollowers from '../../libs/components/member/MemberFollowers';
import { sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import MemberFollowings from '../../libs/components/member/MemberFollowings';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { LIKE_TARGET_MEMBER, SUBSCRIBE, UNSUBSCRIBE } from '../../apollo/user/mutation';
import { Messages } from '../../libs/config';

/** Next.js static generation — i18n tarjimalarini yuklash */
export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const MyPage: NextPage = () => {
	const device = useDeviceDetect();
	/** Global login user — localStorage JWT dan yangilanadi */
	const user = useReactiveVar(userVar);
	const router = useRouter();

	/**
	 * Aktiv bo'lim — URL query dan.
	 * Default: myProfile (menyu bilan mos)
	 */
	const category: any = router.query?.category ?? 'myProfile';

	/** APOLLO REQUESTS — faqat follow/like member (ro'yxatlar child ichida query qiladi) */
	const [subscribe] = useMutation(SUBSCRIBE);
	const [unsubscribe] = useMutation(UNSUBSCRIBE);
	const [likeTargetMember] = useMutation(LIKE_TARGET_MEMBER);

	/**
	 * LIFECYCLES — himoya devori
	 * Login bo'lmagan user mypage ga kirmasligi kerak
	 */
	useEffect(() => {
		if (!user._id) router.push('/').then();
	}, [user]);

	/**
	 * subscribeHandler — boshqa memberga follow qilish
	 * @param id — followingId (kimga obuna)
	 * @param refetch — GET_MEMBER_FOLLOWINGS query refetch funksiyasi
	 * @param query — refetch uchun input (followInquiry)
	 */
	const subscribeHandler = async (id: string, refetch: any, query: any) => {
		try {
			if (!id) throw new Error(Messages.error1);
			if (!user?._id) throw new Error(Messages.error2);

			await subscribe({ variables: { input: id } });
			await sweetTopSmallSuccessAlert('Subscibed', 800); // REVIEW: typo → Subscribed
			await refetch({ input: query });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	/** unsubscribeHandler — obunani bekor qilish */
	const unsubscribeHandler = async (id: string, refetch: any, query: any) => {
		try {
			if (!id) throw new Error(Messages.error1);
			if (!user?._id) throw new Error(Messages.error2);

			await unsubscribe({ variables: { input: id } });
			await sweetTopSmallSuccessAlert('Unsubscibed', 800); // REVIEW: typo → Unsubscribed
			await refetch({ input: query });
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	/** likeMemberHandler — member profilini like (toggle) */
	const likeMemberHandler = async (id: string, refetch: any, query: any) => {
		try {
			if (!id) return;
			if (!user?._id) throw new Error(Messages.error2);

			await likeTargetMember({ variables: { input: id } });
			await sweetTopSmallSuccessAlert('Success', 800);
			await refetch({ input: query });
		} catch (err: any) {
			console.log('likeMemberHandler error', err.message);
			sweetErrorHandling(err.message).then();
		}
	};

	/**
	 * redirectToMemberPageHandler — kartochkadan profilga o'tish
	 * O'zi bo'lsa mypage, boshqasi /member sahifasi
	 */
	const redirectToMemberPageHandler = async (memberId: string) => {
		try {
			if (memberId === user?._id) await router.push(`/mypage?memberId=${memberId}`);
			else await router.push(`/member?memberId=${memberId}`);
		} catch (error) {
			await sweetErrorHandling(error);
		}
	};

	/** MOBIL — hali implement qilinmagan */
	if (device === 'mobile') {
		return <div>MY PAGE</div>;
	} else {
		return (
			<div id="my-page" style={{ position: 'relative' }}>
				<div className="container">
					<Stack className={'my-page'}>
						<Stack className={'back-frame'}>
							{/* CHAP: profil + navigatsiya */}
							<Stack className={'left-config'}>
								<MyMenu />
							</Stack>

							{/* O'NG: category bo'yicha kontent (conditional render) */}
							<Stack className="main-config" mb={'76px'}>
								<Stack className={'list-config'}>
									{category === 'addProperty' && <AddProperty />}
									{category === 'myProperties' && <MyProperties />}
									{category === 'myFavorites' && <MyFavorites />}
									{category === 'recentlyVisited' && <RecentlyVisited />}
									{category === 'myArticles' && <MyArticles />}
									{category === 'writeArticle' && <WriteArticle />}
									{category === 'myProfile' && <MyProfile />}
									{category === 'followers' && (
										<MemberFollowers
											subscribeHandler={subscribeHandler}
											unsubscribeHandler={unsubscribeHandler}
											likeMemberHandler={likeMemberHandler}
											redirectToMemberPageHandler={redirectToMemberPageHandler}
										/>
									)}
									{category === 'followings' && (
										<MemberFollowings
											subscribeHandler={subscribeHandler}
											unsubscribeHandler={unsubscribeHandler}
											likeMemberHandler={likeMemberHandler}
											redirectToMemberPageHandler={redirectToMemberPageHandler}
										/>
									)}
								</Stack>
							</Stack>
						</Stack>
					</Stack>
				</div>
			</div>
		);
	}
};

/** LayoutBasic — banner, footer bilan o'ralgan layout */
export default withLayoutBasic(MyPage);
