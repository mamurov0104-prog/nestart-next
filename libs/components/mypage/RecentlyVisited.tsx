/**
 * =============================================================================
 * RECENTLY VISITED — So'nggi ko'rilgan uylar
 * =============================================================================
 * category=recentlyVisited
 *
 * GraphQL:
 * - GET_VISITED (OrdinaryInquiry) — view service orqali member ko'rgan propertylar
 *
 * Farqi MyFavorites dan:
 * - Like mutation yo'q — faqat ko'rish tarixi
 * - PropertyCard: recentlyVisited={true}
 *
 * Backend:
 * - Har property detail ochilganda view yoziladi (getProperty ichida recordView)
 * - getVisited shu view yozuvlaridan ro'yxat qaytaradi
 *
 * REVIEW:
 * - Mobil matn: "MY FAVORITES MOBILE" — copy-paste xato, "RECENTLY VISITED MOBILE" bo'lishi kerak
 * - id="my-favorites-page" — CSS class nomi favorites bilan bir xil (ataylab qayta ishlatilgan bo'lishi mumkin)
 * - map da key yo'q
 * =============================================================================
 */

import React, { useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Pagination, Stack, Typography } from '@mui/material';
import PropertyCard from '../property/PropertyCard';
import { Property } from '../../types/property/property';
import { T } from '../../types/common';
import { useQuery } from '@apollo/client';
import { GET_VISITED } from '../../../apollo/user/query';

const RecentlyVisited: NextPage = () => {
	const device = useDeviceDetect();
	const [recentlyVisited, setRecentlyVisited] = useState<Property[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [searchVisited, setSearchVisited] = useState<T>({ page: 1, limit: 6 });

	/** APOLLO — faqat o'qish (mutation yo'q) */
	const {
		loading: getVisitedLoading,
		data: getVisitedData,
		error: getVisitedError,
		refetch: getVisitedRefetch,
	} = useQuery(GET_VISITED, {
		fetchPolicy: 'network-only',
		variables: {
			input: searchVisited,
		},
		onCompleted(data: T) {
			setRecentlyVisited(data.getVisited?.list);
			setTotal(data.getVisited?.metaCounter?.[0]?.total || 0);
		},
	});

	const paginationHandler = (e: T, value: number) => {
		setSearchVisited({ ...searchVisited, page: value });
	};

	if (device === 'mobile') {
		// REVIEW: noto'g'ri matn
		return <div>NESTAR MY FAVORITES MOBILE</div>;
	} else {
		return (
			<div id="my-favorites-page">
				<Stack className="main-title-box">
					<Stack className="right-box">
						<Typography className="main-title">Recently Visited</Typography>
						<Typography className="sub-title">We are glad to see you again!</Typography>
					</Stack>
				</Stack>
				<Stack className="favorites-list-box">
					{recentlyVisited?.length ? (
						recentlyVisited?.map((property: Property) => {
							return <PropertyCard property={property} recentlyVisited={true} />;
						})
					) : (
						<div className={'no-data'}>
							<img src="/img/icons/icoAlert.svg" alt="" />
							<p>No Recently Visited Properties found!</p>
						</div>
					)}
				</Stack>
				{recentlyVisited?.length ? (
					<Stack className="pagination-config">
						<Stack className="pagination-box">
							<Pagination
								count={Math.ceil(total / searchVisited.limit)}
								page={searchVisited.page}
								shape="circular"
								color="primary"
								onChange={paginationHandler}
							/>
						</Stack>
						<Stack className="total-result">
							<Typography>
								Total {total} recently visited propert{total > 1 ? 'ies' : 'y'}
							</Typography>
						</Stack>
					</Stack>
				) : null}
			</div>
		);
	}
};

export default RecentlyVisited;
