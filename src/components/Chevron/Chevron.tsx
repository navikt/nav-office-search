import React from 'react';

import style from './Chevron.module.css';

export const Chevron = ({ className }: React.HTMLProps<HTMLSpanElement>) => {
    return (
        <span className={`${style.chevron} ${className}`}>
            <span className={style.left} />
            <span className={style.right} />
        </span>
    );
};
