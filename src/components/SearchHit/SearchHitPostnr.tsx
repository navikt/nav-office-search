import React from 'react';

import style from 'SearchHit.module.css';
import { SearchHitProps } from '../../types/searchHitProps';

type Props = {
    postnr: string;
    poststed: string;
    hits: SearchHitProps[];
};

const getUrl = () => 'https://www.nav.no';

export const SearchHitPostnr = ({ postnr, poststed, hits }: Props) => {
    return (
        <div className={style.searchHit}>
            <div className={style.description}>
                {`NAV-kontor for`}
                <strong>{`${postnr} ${poststed}:`}</strong>
            </div>
            <div className={style.link}>{getUrl()}</div>
        </div>
    );
};
