import classNames from 'classnames';
import React from 'react';
import style from './Chevron.module.css';

export const Chevron = (props: React.HTMLProps<HTMLSpanElement>) => {
    return (
        <span {...props} className={classNames(style.chevron, props.className)}>
            <span className={style.left} />
            <span className={style.right} />
        </span>
    );
};
