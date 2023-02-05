import React from 'react';

import style from './Chevron.module.css';

export const Chevron = ({
    className,
    ...rest
}: React.HTMLProps<HTMLSpanElement>) => {
    return (
        <span
            {...rest}
            className={`${style.chevron}${className ? ` ${className}` : ''}`}
        >
            <span className={style.left} />
            <span className={style.right} />
        </span>
    );
};
