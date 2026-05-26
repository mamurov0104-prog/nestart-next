/**
 * =============================================================================
 * WRITE ARTICLE — Maqola yozish bo'limi
 * =============================================================================
 * category=writeArticle da ko'rinadi.
 *
 * Mantiq:
 * - Asosiy editor: community/Teditor (Toast UI Editor)
 * - dynamic(..., { ssr: false }) — editor browser API ishlatadi, SSR da xato bermasligi uchun
 * - Teditor ichida createBoardArticle mutation va muvaffaqiyatdan keyin
 *   router.push('/mypage?category=myArticles')
 *
 * REVIEW:
 * - Bu fayl juda yupqa (thin wrapper) — biznes mantiq Teditor.tsx da
 * - Mobil stub
 * =============================================================================
 */

import React from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Stack, Typography } from '@mui/material';
import dynamic from 'next/dynamic';

/** SSR o'chirilgan — faqat clientda yuklanadi */
const TuiEditor = dynamic(() => import('../community/Teditor'), { ssr: false });

const WriteArticle: NextPage = () => {
	const device = useDeviceDetect();

	if (device === 'mobile') {
		return <>ARTICLE PAGE MOBILE</>;
	} else
		return (
			<div id="write-article-page">
				<Stack className="main-title-box">
					<Stack className="right-box">
						<Typography className="main-title">Write an Article</Typography>
						<Typography className="sub-title">Feel free to write your ideas!</Typography>
					</Stack>
				</Stack>
				{/* Kategoriya, sarlavha, HTML content — Teditor ichida boshqariladi */}
				<TuiEditor />
			</div>
		);
};

export default WriteArticle;
