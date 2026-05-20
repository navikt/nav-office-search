import { jsx, jsxs, Fragment } from 'preact/jsx-runtime';
import { renderToString } from 'preact/compat/server';
import React, {
    useRef,
    useLayoutEffect,
    useState,
    useEffect,
    createContext,
    useContext,
    forwardRef,
    Fragment as Fragment$1,
} from 'preact/compat';
import debounce from 'lodash.debounce';
import { onLanguageSelect, setParams } from '@navikt/nav-dekoratoren-moduler';
function r(e) {
    var t,
        f,
        n = '';
    if ('string' == typeof e || 'number' == typeof e) n += e;
    else if ('object' == typeof e)
        if (Array.isArray(e)) {
            var o = e.length;
            for (t = 0; t < o; t++)
                e[t] && (f = r(e[t])) && (n && (n += ' '), (n += f));
        } else for (f in e) e[f] && (n && (n += ' '), (n += f));
    return n;
}
function clsx() {
    for (var e, t, f = 0, n = '', o = arguments.length; f < o; f++)
        (e = arguments[f]) && (t = r(e)) && (n && (n += ' '), (n += t));
    return n;
}
const UNINITIALIZED = {};
function useRefWithInit(init, initArg) {
    const ref = useRef(UNINITIALIZED);
    if (ref.current === UNINITIALIZED) {
        ref.current = init(initArg);
    }
    return ref;
}
const useInsertionEffect =
    React[`useInsertionEffect${Math.random().toFixed(1)}`.slice(0, -3)];
const useSafeInsertionEffect =
    // React 17 doesn't have useInsertionEffect.
    useInsertionEffect && // Preact replaces useInsertionEffect with useLayoutEffect and fires too late.
    useInsertionEffect !== useLayoutEffect
        ? useInsertionEffect
        : (fn) => fn();
function useEventCallback(callback) {
    const stable = useRefWithInit(createStableCallback).current;
    stable.next = callback;
    useSafeInsertionEffect(stable.effect);
    return stable.trampoline;
}
function createStableCallback() {
    const stable = {
        next: void 0,
        callback: assertNotCalled,
        trampoline: (...args) => {
            var _a;
            return (_a = stable.callback) === null || _a === void 0
                ? void 0
                : _a.call(stable, ...args);
        },
        effect: () => {
            stable.callback = stable.next;
        },
    };
    return stable;
}
function assertNotCalled() {
    if (process.env.NODE_ENV !== 'production') {
        throw new Error('Aksel: Cannot call an event handler while rendering.');
    }
}
function useControllableState({ value: valueProp, defaultValue, onChange }) {
    const onChangeProp = useEventCallback(onChange);
    const [uncontrolledState, setUncontrolledState] = useState(defaultValue);
    const controlled = valueProp !== void 0;
    const value = controlled ? valueProp : uncontrolledState;
    const setValue = useEventCallback((next) => {
        const setter = next;
        const nextValue = typeof next === 'function' ? setter(value) : next;
        if (!controlled) {
            setUncontrolledState(nextValue);
        }
        onChangeProp(nextValue);
    });
    return [value, setValue];
}
function useMergeRefs(a, b, c, d) {
    const forkRef = useRefWithInit(createForkRef).current;
    if (didChange(forkRef, a, b, c, d)) {
        update(forkRef, [a, b, c, d]);
    }
    return forkRef.callback;
}
function createForkRef() {
    return {
        callback: null,
        cleanup: null,
        refs: [],
    };
}
function didChange(forkRef, a, b, c, d) {
    return (
        forkRef.refs[0] !== a ||
        forkRef.refs[1] !== b ||
        forkRef.refs[2] !== c ||
        forkRef.refs[3] !== d
    );
}
function update(forkRef, refs) {
    forkRef.refs = refs;
    if (refs.every((ref) => ref == null)) {
        forkRef.callback = null;
        return;
    }
    forkRef.callback = (instance) => {
        if (forkRef.cleanup) {
            forkRef.cleanup();
            forkRef.cleanup = null;
        }
        if (instance != null) {
            const cleanupCallbacks = Array(refs.length).fill(null);
            for (let i = 0; i < refs.length; i += 1) {
                const ref = refs[i];
                if (ref == null) {
                    continue;
                }
                switch (typeof ref) {
                    case 'function': {
                        const refCleanup = ref(instance);
                        if (typeof refCleanup === 'function') {
                            cleanupCallbacks[i] = refCleanup;
                        }
                        break;
                    }
                    case 'object': {
                        ref.current = instance;
                        break;
                    }
                }
            }
            forkRef.cleanup = () => {
                for (let i = 0; i < refs.length; i += 1) {
                    const ref = refs[i];
                    if (ref == null) {
                        continue;
                    }
                    switch (typeof ref) {
                        case 'function': {
                            const cleanupCallback = cleanupCallbacks[i];
                            if (typeof cleanupCallback === 'function') {
                                cleanupCallback();
                            } else {
                                ref(null);
                            }
                            break;
                        }
                        case 'object': {
                            ref.current = null;
                            break;
                        }
                    }
                }
            };
        }
    };
}
let globalId$1 = 0;
function useGlobalId$1(idOverride) {
    const [defaultId, setDefaultId] = useState(idOverride);
    const id = idOverride || defaultId;
    useEffect(() => {
        if (defaultId == null) {
            globalId$1 += 1;
            setDefaultId(`aksel-id-${globalId$1}`);
        }
    }, [defaultId]);
    return id;
}
const maybeReactUseId$1 =
    React[
        'useId'
        // Workaround for https://github.com/webpack/webpack/issues/14814
    ];
function useId$1(idOverride) {
    var _a;
    if (maybeReactUseId$1 !== void 0) {
        const reactId = maybeReactUseId$1();
        return reactId.replace(/(:)/g, '');
    }
    return (_a = useGlobalId$1(idOverride)) !== null && _a !== void 0 ? _a : '';
}
function mergeProps(slotProps, childProps) {
    const overrideProps = Object.assign({}, childProps);
    for (const propName in childProps) {
        const slotPropValue = slotProps[propName];
        const childPropValue = childProps[propName];
        const isHandler = /^on[A-Z]/.test(propName);
        if (isHandler) {
            if (slotPropValue && childPropValue) {
                overrideProps[propName] = (...args) => {
                    childPropValue(...args);
                    slotPropValue(...args);
                };
            } else if (slotPropValue) {
                overrideProps[propName] = slotPropValue;
            }
        } else if (propName === 'style') {
            overrideProps[propName] = Object.assign(
                Object.assign({}, slotPropValue),
                childPropValue
            );
        } else if (propName === 'className') {
            overrideProps[propName] = [slotPropValue, childPropValue]
                .filter(Boolean)
                .join(' ');
        }
    }
    return Object.assign(Object.assign({}, slotProps), overrideProps);
}
var __rest$h = function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
        for (
            var i = 0, p = Object.getOwnPropertySymbols(s);
            i < p.length;
            i++
        ) {
            if (
                e.indexOf(p[i]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(s, p[i])
            )
                t[p[i]] = s[p[i]];
        }
    return t;
};
function getChildRef(children) {
    if (!React.isValidElement(children)) {
        return null;
    }
    return Object.prototype.propertyIsEnumerable.call(children.props, 'ref')
        ? children.props.ref
        : children.ref;
}
const Slot = React.forwardRef((props, forwardedRef) => {
    var _a;
    const { children } = props,
        slotProps = __rest$h(props, ['children']);
    const childRef = getChildRef(children);
    const mergedRef = useMergeRefs(forwardedRef, childRef);
    if (React.isValidElement(children)) {
        return React.cloneElement(
            children,
            Object.assign(
                Object.assign({}, mergeProps(slotProps, children.props)),
                { ref: mergedRef }
            )
        );
    }
    if (React.Children.count(children) > 1) {
        const error2 = new Error(
            "Aksel: Components using 'asChild' expects to recieve a single React element child."
        );
        error2.name = 'SlotError';
        (_a = Error.captureStackTrace) === null || _a === void 0
            ? void 0
            : _a.call(Error, error2, Slot);
        throw error2;
    }
    return null;
});
var __rest$g = function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
        for (
            var i = 0, p = Object.getOwnPropertySymbols(s);
            i < p.length;
            i++
        ) {
            if (
                e.indexOf(p[i]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(s, p[i])
            )
                t[p[i]] = s[p[i]];
        }
    return t;
};
function getErrorMessage(name) {
    return `Aksel: use${name}Context returned \`undefined\`. Seems you forgot to wrap component within ${name}Provider`;
}
function createStrictContext(options) {
    const { name, defaultValue, errorMessage } = options;
    const hasDefault = 'defaultValue' in options;
    const Context = createContext(defaultValue);
    Context.displayName = name;
    function Provider(_a) {
        var { children } = _a,
            context = __rest$g(_a, ['children']);
        const value = React.useMemo(() => context, Object.values(context));
        return React.createElement(Context.Provider, { value }, children);
    }
    Provider.displayName = `${name}Provider`;
    function useContext$1(strict = true) {
        var _a;
        const context = useContext(Context);
        if (!hasDefault && !context && strict) {
            const error2 = new Error(
                errorMessage !== null && errorMessage !== void 0
                    ? errorMessage
                    : getErrorMessage(name)
            );
            error2.name = 'ContextError';
            (_a = Error.captureStackTrace) === null || _a === void 0
                ? void 0
                : _a.call(Error, error2, useContext$1);
            throw error2;
        }
        return context;
    }
    return { Provider, useContext: useContext$1 };
}
const { Provider: RenameCSSProvider, useContext: useRenameCSS } =
    createStrictContext({
        name: 'RenameCSS',
        defaultValue: { cn: clsx },
    });
const compositeClassFunction = (...inputs) => {
    const classes = clsx(inputs)
        .replace(/^navds-/g, 'aksel-')
        .replace(/\snavds-/g, ' aksel-');
    return classes.trim();
};
const RenameCSS = ({ children }) => {
    return React.createElement(
        RenameCSSProvider,
        { cn: compositeClassFunction },
        children
    );
};
const DEFAULT_COLOR = 'accent';
const { Provider: ThemeProvider, useContext: useThemeInternal } =
    createStrictContext({
        name: 'ThemeProvider',
        defaultValue: {
            color: DEFAULT_COLOR,
            isDarkside: false,
        },
    });
forwardRef((props, ref) => {
    const context = useThemeInternal();
    const {
        children,
        className,
        asChild = false,
        theme = context === null || context === void 0 ? void 0 : context.theme,
        hasBackground: hasBackgroundProp = true,
        'data-color': color = context === null || context === void 0
            ? void 0
            : context.color,
    } = props;
    const isRoot = !(context === null || context === void 0
        ? void 0
        : context.isDarkside);
    const hasBackground =
        hasBackgroundProp !== null && hasBackgroundProp !== void 0
            ? hasBackgroundProp
            : isRoot && props.theme !== void 0;
    const SlotElement = asChild ? Slot : 'div';
    return React.createElement(
        ThemeProvider,
        { theme, color, isDarkside: true },
        React.createElement(
            RenameCSS,
            null,
            React.createElement(
                SlotElement,
                {
                    ref,
                    className: clsx('aksel-theme', className, theme),
                    'data-background': hasBackground,
                    'data-color':
                        color !== null && color !== void 0 ? color : '',
                },
                children
            )
        )
    );
});
const typoClassNames = (props) => {
    return clsx({
        'navds-typo--spacing': props.spacing,
        'navds-typo--truncate': props.truncate,
        'navds-typo--semibold': props.weight === 'semibold',
        [`navds-typo--align-${props.align}`]: props.align,
        [`navds-typo--color-${props.textColor}`]: props.textColor,
        'navds-typo--visually-hidden': props.visuallyHidden,
        'navds-typo--uppercase': props.uppercase,
    });
};
var __rest$f = function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
        for (
            var i = 0, p = Object.getOwnPropertySymbols(s);
            i < p.length;
            i++
        ) {
            if (
                e.indexOf(p[i]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(s, p[i])
            )
                t[p[i]] = s[p[i]];
        }
    return t;
};
const BodyLong = forwardRef((_a, ref) => {
    var {
            className,
            size = 'medium',
            as: Component = 'p',
            spacing,
            truncate,
            weight = 'regular',
            align,
            visuallyHidden,
            textColor,
        } = _a,
        rest = __rest$f(_a, [
            'className',
            'size',
            'as',
            'spacing',
            'truncate',
            'weight',
            'align',
            'visuallyHidden',
            'textColor',
        ]);
    const { cn } = useRenameCSS();
    return React.createElement(
        Component,
        Object.assign({}, rest, {
            ref,
            className: cn(
                className,
                'navds-body-long',
                `navds-body-long--${size}`,
                typoClassNames({
                    spacing,
                    truncate,
                    weight,
                    align,
                    visuallyHidden,
                    textColor,
                })
            ),
        })
    );
});
var __rest$e = function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
        for (
            var i = 0, p = Object.getOwnPropertySymbols(s);
            i < p.length;
            i++
        ) {
            if (
                e.indexOf(p[i]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(s, p[i])
            )
                t[p[i]] = s[p[i]];
        }
    return t;
};
const BodyShort = forwardRef((_a, ref) => {
    var {
            className,
            size = 'medium',
            as: Component = 'p',
            spacing,
            truncate,
            weight = 'regular',
            align,
            visuallyHidden,
            textColor,
        } = _a,
        rest = __rest$e(_a, [
            'className',
            'size',
            'as',
            'spacing',
            'truncate',
            'weight',
            'align',
            'visuallyHidden',
            'textColor',
        ]);
    const { cn } = useRenameCSS();
    return React.createElement(
        Component,
        Object.assign({}, rest, {
            ref,
            className: cn(
                className,
                'navds-body-short',
                `navds-body-short--${size}`,
                typoClassNames({
                    spacing,
                    truncate,
                    weight,
                    align,
                    visuallyHidden,
                    textColor,
                })
            ),
        })
    );
});
var __rest$d = function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
        for (
            var i = 0, p = Object.getOwnPropertySymbols(s);
            i < p.length;
            i++
        ) {
            if (
                e.indexOf(p[i]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(s, p[i])
            )
                t[p[i]] = s[p[i]];
        }
    return t;
};
forwardRef((_a, ref) => {
    var {
            className,
            size = 'medium',
            spacing,
            uppercase,
            as: Component = 'p',
            truncate,
            weight = 'regular',
            align,
            visuallyHidden,
            textColor,
        } = _a,
        rest = __rest$d(_a, [
            'className',
            'size',
            'spacing',
            'uppercase',
            'as',
            'truncate',
            'weight',
            'align',
            'visuallyHidden',
            'textColor',
        ]);
    const { cn } = useRenameCSS();
    return React.createElement(
        Component,
        Object.assign({}, rest, {
            ref,
            className: cn(
                className,
                'navds-detail',
                typoClassNames({
                    spacing,
                    truncate,
                    weight,
                    align,
                    visuallyHidden,
                    textColor,
                    uppercase,
                }),
                {
                    'navds-detail--small': size === 'small',
                }
            ),
        })
    );
});
var __rest$c = function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
        for (
            var i = 0, p = Object.getOwnPropertySymbols(s);
            i < p.length;
            i++
        ) {
            if (
                e.indexOf(p[i]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(s, p[i])
            )
                t[p[i]] = s[p[i]];
        }
    return t;
};
const ErrorMessage = forwardRef((_a, ref) => {
    var {
            children,
            className,
            size,
            spacing,
            as: Component = 'p',
            showIcon = false,
        } = _a,
        rest = __rest$c(_a, [
            'children',
            'className',
            'size',
            'spacing',
            'as',
            'showIcon',
        ]);
    const { cn } = useRenameCSS();
    return React.createElement(
        Component,
        Object.assign({}, rest, {
            ref,
            className: cn(
                'navds-error-message',
                'navds-label',
                className,
                typoClassNames({
                    spacing,
                }),
                {
                    'navds-label--small': size === 'small',
                    'navds-error-message--show-icon': showIcon,
                }
            ),
        }),
        showIcon &&
            React.createElement(
                'svg',
                {
                    viewBox: '0 0 17 16',
                    fill: 'none',
                    xmlns: 'http://www.w3.org/2000/svg',
                    focusable: false,
                    'aria-hidden': true,
                },
                React.createElement('path', {
                    fillRule: 'evenodd',
                    clipRule: 'evenodd',
                    d: 'M3.49209 11.534L8.11398 2.7594C8.48895 2.04752 9.50833 2.04743 9.88343 2.75924L14.5073 11.5339C14.8582 12.1998 14.3753 13 13.6226 13H4.37685C3.6242 13 3.14132 12.1999 3.49209 11.534ZM9.74855 10.495C9.74855 10.9092 9.41276 11.245 8.99855 11.245C8.58433 11.245 8.24855 10.9092 8.24855 10.495C8.24855 10.0808 8.58433 9.74497 8.99855 9.74497C9.41276 9.74497 9.74855 10.0808 9.74855 10.495ZM9.49988 5.49997C9.49988 5.22383 9.27602 4.99997 8.99988 4.99997C8.72373 4.99997 8.49988 5.22383 8.49988 5.49997V7.99997C8.49988 8.27611 8.72373 8.49997 8.99988 8.49997C9.27602 8.49997 9.49988 8.27611 9.49988 7.99997V5.49997Z',
                    fill: 'currentColor',
                })
            ),
        children
    );
});
var __rest$b = function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
        for (
            var i = 0, p = Object.getOwnPropertySymbols(s);
            i < p.length;
            i++
        ) {
            if (
                e.indexOf(p[i]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(s, p[i])
            )
                t[p[i]] = s[p[i]];
        }
    return t;
};
const Heading = forwardRef((_a, ref) => {
    var {
            level = '1',
            size,
            className,
            as,
            spacing,
            align,
            visuallyHidden,
            textColor,
        } = _a,
        rest = __rest$b(_a, [
            'level',
            'size',
            'className',
            'as',
            'spacing',
            'align',
            'visuallyHidden',
            'textColor',
        ]);
    const { cn } = useRenameCSS();
    const HeadingTag = as !== null && as !== void 0 ? as : `h${level}`;
    return React.createElement(
        HeadingTag,
        Object.assign({}, rest, {
            ref,
            className: cn(
                className,
                'navds-heading',
                `navds-heading--${size}`,
                typoClassNames({
                    spacing,
                    align,
                    visuallyHidden,
                    textColor,
                })
            ),
        })
    );
});
var __rest$a = function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
        for (
            var i = 0, p = Object.getOwnPropertySymbols(s);
            i < p.length;
            i++
        ) {
            if (
                e.indexOf(p[i]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(s, p[i])
            )
                t[p[i]] = s[p[i]];
        }
    return t;
};
forwardRef((_a, ref) => {
    var { className, spacing, as: Component = 'p' } = _a,
        rest = __rest$a(_a, ['className', 'spacing', 'as']);
    const { cn } = useRenameCSS();
    return React.createElement(
        Component,
        Object.assign({}, rest, {
            ref,
            className: cn(className, 'navds-ingress', {
                'navds-typo--spacing': !!spacing,
            }),
        })
    );
});
var __rest$9 = function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
        for (
            var i = 0, p = Object.getOwnPropertySymbols(s);
            i < p.length;
            i++
        ) {
            if (
                e.indexOf(p[i]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(s, p[i])
            )
                t[p[i]] = s[p[i]];
        }
    return t;
};
const Label = forwardRef((_a, ref) => {
    var {
            className,
            size = 'medium',
            as: Component = 'label',
            spacing,
            visuallyHidden,
            textColor,
        } = _a,
        rest = __rest$9(_a, [
            'className',
            'size',
            'as',
            'spacing',
            'visuallyHidden',
            'textColor',
        ]);
    const { cn } = useRenameCSS();
    return React.createElement(
        Component,
        Object.assign({}, rest, {
            ref,
            className: cn(
                className,
                'navds-label',
                typoClassNames({
                    spacing,
                    visuallyHidden,
                    textColor,
                }),
                {
                    'navds-label--small': size === 'small',
                }
            ),
        })
    );
});
function omit(obj, props) {
    const filteredEntries = Object.entries(obj).filter(
        ([key]) => !props.includes(key)
    );
    return Object.fromEntries(filteredEntries);
}
let globalId = 0;
function useGlobalId(idOverride) {
    const [defaultId, setDefaultId] = useState(idOverride);
    const id = idOverride || defaultId;
    useEffect(() => {
        if (defaultId == null) {
            globalId += 1;
            setDefaultId(`aksel-icon-${globalId}`);
        }
    }, [defaultId]);
    return id;
}
const maybeReactUseId =
    React[
        'useId'
        // Workaround for https://github.com/webpack/webpack/issues/14814
    ];
function useId(idOverride) {
    var _a;
    if (maybeReactUseId !== void 0) {
        const reactId = maybeReactUseId();
        return reactId.replace(/(:)/g, '');
    }
    return (_a = useGlobalId(idOverride)) !== null && _a !== void 0 ? _a : '';
}
var __rest$8 = function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
        for (
            var i = 0, p = Object.getOwnPropertySymbols(s);
            i < p.length;
            i++
        ) {
            if (
                e.indexOf(p[i]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(s, p[i])
            )
                t[p[i]] = s[p[i]];
        }
    return t;
};
const SvgChevronDown = forwardRef((_a, ref) => {
    var { title: title2, titleId: _titleId } = _a,
        props = __rest$8(_a, ['title', 'titleId']);
    let titleId = useId();
    titleId = title2 ? (_titleId ? _titleId : 'title-' + titleId) : void 0;
    return React.createElement(
        'svg',
        Object.assign(
            {
                xmlns: 'http://www.w3.org/2000/svg',
                width: '1em',
                height: '1em',
                fill: 'none',
                viewBox: '0 0 24 24',
                focusable: false,
                role: 'img',
                ref,
                'aria-labelledby': titleId,
            },
            props
        ),
        title2 ? React.createElement('title', { id: titleId }, title2) : null,
        React.createElement('path', {
            fill: 'currentColor',
            fillRule: 'evenodd',
            d: 'M5.97 9.47a.75.75 0 0 1 1.06 0L12 14.44l4.97-4.97a.75.75 0 1 1 1.06 1.06l-5.5 5.5a.75.75 0 0 1-1.06 0l-5.5-5.5a.75.75 0 0 1 0-1.06',
            clipRule: 'evenodd',
        })
    );
});
var __rest$7 = function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
        for (
            var i = 0, p = Object.getOwnPropertySymbols(s);
            i < p.length;
            i++
        ) {
            if (
                e.indexOf(p[i]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(s, p[i])
            )
                t[p[i]] = s[p[i]];
        }
    return t;
};
const SvgMagnifyingGlass = forwardRef((_a, ref) => {
    var { title: title2, titleId: _titleId } = _a,
        props = __rest$7(_a, ['title', 'titleId']);
    let titleId = useId();
    titleId = title2 ? (_titleId ? _titleId : 'title-' + titleId) : void 0;
    return React.createElement(
        'svg',
        Object.assign(
            {
                xmlns: 'http://www.w3.org/2000/svg',
                width: '1em',
                height: '1em',
                fill: 'none',
                viewBox: '0 0 24 24',
                focusable: false,
                role: 'img',
                ref,
                'aria-labelledby': titleId,
            },
            props
        ),
        title2 ? React.createElement('title', { id: titleId }, title2) : null,
        React.createElement('path', {
            fill: 'currentColor',
            fillRule: 'evenodd',
            d: 'M10.5 3.25a7.25 7.25 0 1 0 4.569 12.88l5.411 5.41a.75.75 0 1 0 1.06-1.06l-5.41-5.411A7.25 7.25 0 0 0 10.5 3.25M4.75 10.5a5.75 5.75 0 1 1 11.5 0 5.75 5.75 0 0 1-11.5 0',
            clipRule: 'evenodd',
        })
    );
});
var __rest$6 = function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
        for (
            var i = 0, p = Object.getOwnPropertySymbols(s);
            i < p.length;
            i++
        ) {
            if (
                e.indexOf(p[i]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(s, p[i])
            )
                t[p[i]] = s[p[i]];
        }
    return t;
};
const SvgXMark = forwardRef((_a, ref) => {
    var { title: title2, titleId: _titleId } = _a,
        props = __rest$6(_a, ['title', 'titleId']);
    let titleId = useId();
    titleId = title2 ? (_titleId ? _titleId : 'title-' + titleId) : void 0;
    return React.createElement(
        'svg',
        Object.assign(
            {
                xmlns: 'http://www.w3.org/2000/svg',
                width: '1em',
                height: '1em',
                fill: 'none',
                viewBox: '0 0 24 24',
                focusable: false,
                role: 'img',
                ref,
                'aria-labelledby': titleId,
            },
            props
        ),
        title2 ? React.createElement('title', { id: titleId }, title2) : null,
        React.createElement('path', {
            fill: 'currentColor',
            d: 'M6.53 5.47a.75.75 0 0 0-1.06 1.06L10.94 12l-5.47 5.47a.75.75 0 1 0 1.06 1.06L12 13.06l5.47 5.47a.75.75 0 1 0 1.06-1.06L13.06 12l5.47-5.47a.75.75 0 0 0-1.06-1.06L12 10.94z',
        })
    );
});
function composeEventHandlers(
    originalEventHandler,
    ourEventHandler,
    { checkForDefaultPrevented = true } = {}
) {
    return function handleEvent(event) {
        originalEventHandler === null || originalEventHandler === void 0
            ? void 0
            : originalEventHandler(event);
        if (checkForDefaultPrevented === false || !event.defaultPrevented) {
            return ourEventHandler === null || ourEventHandler === void 0
                ? void 0
                : ourEventHandler(event);
        }
    };
}
function buildFormatLongFn(args) {
    return (options = {}) => {
        const width = options.width ? String(options.width) : args.defaultWidth;
        const format = args.formats[width] || args.formats[args.defaultWidth];
        return format;
    };
}
function buildLocalizeFn(args) {
    return (value, options) => {
        const context = options?.context
            ? String(options.context)
            : 'standalone';
        let valuesArray;
        if (context === 'formatting' && args.formattingValues) {
            const defaultWidth =
                args.defaultFormattingWidth || args.defaultWidth;
            const width = options?.width ? String(options.width) : defaultWidth;
            valuesArray =
                args.formattingValues[width] ||
                args.formattingValues[defaultWidth];
        } else {
            const defaultWidth = args.defaultWidth;
            const width = options?.width
                ? String(options.width)
                : args.defaultWidth;
            valuesArray = args.values[width] || args.values[defaultWidth];
        }
        const index = args.argumentCallback
            ? args.argumentCallback(value)
            : value;
        return valuesArray[index];
    };
}
function buildMatchFn(args) {
    return (string, options = {}) => {
        const width = options.width;
        const matchPattern =
            (width && args.matchPatterns[width]) ||
            args.matchPatterns[args.defaultMatchWidth];
        const matchResult = string.match(matchPattern);
        if (!matchResult) {
            return null;
        }
        const matchedString = matchResult[0];
        const parsePatterns =
            (width && args.parsePatterns[width]) ||
            args.parsePatterns[args.defaultParseWidth];
        const key = Array.isArray(parsePatterns)
            ? findIndex(parsePatterns, (pattern) => pattern.test(matchedString))
            : // [TODO] -- I challenge you to fix the type
              findKey(parsePatterns, (pattern) => pattern.test(matchedString));
        let value;
        value = args.valueCallback ? args.valueCallback(key) : key;
        value = options.valueCallback
            ? // [TODO] -- I challenge you to fix the type
              options.valueCallback(value)
            : value;
        const rest = string.slice(matchedString.length);
        return { value, rest };
    };
}
function findKey(object, predicate) {
    for (const key in object) {
        if (
            Object.prototype.hasOwnProperty.call(object, key) &&
            predicate(object[key])
        ) {
            return key;
        }
    }
    return void 0;
}
function findIndex(array, predicate) {
    for (let key = 0; key < array.length; key++) {
        if (predicate(array[key])) {
            return key;
        }
    }
    return void 0;
}
function buildMatchPatternFn(args) {
    return (string, options = {}) => {
        const matchResult = string.match(args.matchPattern);
        if (!matchResult) return null;
        const matchedString = matchResult[0];
        const parseResult = string.match(args.parsePattern);
        if (!parseResult) return null;
        let value = args.valueCallback
            ? args.valueCallback(parseResult[0])
            : parseResult[0];
        value = options.valueCallback ? options.valueCallback(value) : value;
        const rest = string.slice(matchedString.length);
        return { value, rest };
    };
}
const formatDistanceLocale = {
    lessThanXSeconds: {
        one: 'mindre enn ett sekund',
        other: 'mindre enn {{count}} sekunder',
    },
    xSeconds: {
        one: 'ett sekund',
        other: '{{count}} sekunder',
    },
    halfAMinute: 'et halvt minutt',
    lessThanXMinutes: {
        one: 'mindre enn ett minutt',
        other: 'mindre enn {{count}} minutter',
    },
    xMinutes: {
        one: 'ett minutt',
        other: '{{count}} minutter',
    },
    aboutXHours: {
        one: 'omtrent en time',
        other: 'omtrent {{count}} timer',
    },
    xHours: {
        one: 'en time',
        other: '{{count}} timer',
    },
    xDays: {
        one: 'en dag',
        other: '{{count}} dager',
    },
    aboutXWeeks: {
        one: 'omtrent en uke',
        other: 'omtrent {{count}} uker',
    },
    xWeeks: {
        one: 'en uke',
        other: '{{count}} uker',
    },
    aboutXMonths: {
        one: 'omtrent en måned',
        other: 'omtrent {{count}} måneder',
    },
    xMonths: {
        one: 'en måned',
        other: '{{count}} måneder',
    },
    aboutXYears: {
        one: 'omtrent ett år',
        other: 'omtrent {{count}} år',
    },
    xYears: {
        one: 'ett år',
        other: '{{count}} år',
    },
    overXYears: {
        one: 'over ett år',
        other: 'over {{count}} år',
    },
    almostXYears: {
        one: 'nesten ett år',
        other: 'nesten {{count}} år',
    },
};
const formatDistance = (token, count, options) => {
    let result;
    const tokenValue = formatDistanceLocale[token];
    if (typeof tokenValue === 'string') {
        result = tokenValue;
    } else if (count === 1) {
        result = tokenValue.one;
    } else {
        result = tokenValue.other.replace('{{count}}', String(count));
    }
    if (options?.addSuffix) {
        if (options.comparison && options.comparison > 0) {
            return 'om ' + result;
        } else {
            return result + ' siden';
        }
    }
    return result;
};
const dateFormats = {
    full: 'EEEE d. MMMM y',
    long: 'd. MMMM y',
    medium: 'd. MMM y',
    short: 'dd.MM.y',
};
const timeFormats = {
    full: "'kl'. HH:mm:ss zzzz",
    long: 'HH:mm:ss z',
    medium: 'HH:mm:ss',
    short: 'HH:mm',
};
const dateTimeFormats = {
    full: "{{date}} 'kl.' {{time}}",
    long: "{{date}} 'kl.' {{time}}",
    medium: '{{date}} {{time}}',
    short: '{{date}} {{time}}',
};
const formatLong = {
    date: buildFormatLongFn({
        formats: dateFormats,
        defaultWidth: 'full',
    }),
    time: buildFormatLongFn({
        formats: timeFormats,
        defaultWidth: 'full',
    }),
    dateTime: buildFormatLongFn({
        formats: dateTimeFormats,
        defaultWidth: 'full',
    }),
};
const formatRelativeLocale = {
    lastWeek: "'forrige' eeee 'kl.' p",
    yesterday: "'i går kl.' p",
    today: "'i dag kl.' p",
    tomorrow: "'i morgen kl.' p",
    nextWeek: "EEEE 'kl.' p",
    other: 'P',
};
const formatRelative = (token, _date, _baseDate, _options) =>
    formatRelativeLocale[token];
const eraValues = {
    narrow: ['f.Kr.', 'e.Kr.'],
    abbreviated: ['f.Kr.', 'e.Kr.'],
    wide: ['før Kristus', 'etter Kristus'],
};
const quarterValues = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
    wide: ['1. kvartal', '2. kvartal', '3. kvartal', '4. kvartal'],
};
const monthValues = {
    narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    abbreviated: [
        'jan.',
        'feb.',
        'mars',
        'apr.',
        'mai',
        'juni',
        'juli',
        'aug.',
        'sep.',
        'okt.',
        'nov.',
        'des.',
    ],
    wide: [
        'januar',
        'februar',
        'mars',
        'april',
        'mai',
        'juni',
        'juli',
        'august',
        'september',
        'oktober',
        'november',
        'desember',
    ],
};
const dayValues = {
    narrow: ['S', 'M', 'T', 'O', 'T', 'F', 'L'],
    short: ['sø', 'ma', 'ti', 'on', 'to', 'fr', 'lø'],
    abbreviated: ['søn', 'man', 'tir', 'ons', 'tor', 'fre', 'lør'],
    wide: [
        'søndag',
        'mandag',
        'tirsdag',
        'onsdag',
        'torsdag',
        'fredag',
        'lørdag',
    ],
};
const dayPeriodValues = {
    narrow: {
        am: 'a',
        pm: 'p',
        midnight: 'midnatt',
        noon: 'middag',
        morning: 'på morg.',
        afternoon: 'på etterm.',
        evening: 'på kvelden',
        night: 'på natten',
    },
    abbreviated: {
        am: 'a.m.',
        pm: 'p.m.',
        midnight: 'midnatt',
        noon: 'middag',
        morning: 'på morg.',
        afternoon: 'på etterm.',
        evening: 'på kvelden',
        night: 'på natten',
    },
    wide: {
        am: 'a.m.',
        pm: 'p.m.',
        midnight: 'midnatt',
        noon: 'middag',
        morning: 'på morgenen',
        afternoon: 'på ettermiddagen',
        evening: 'på kvelden',
        night: 'på natten',
    },
};
const ordinalNumber = (dirtyNumber, _options) => {
    const number = Number(dirtyNumber);
    return number + '.';
};
const localize = {
    ordinalNumber,
    era: buildLocalizeFn({
        values: eraValues,
        defaultWidth: 'wide',
    }),
    quarter: buildLocalizeFn({
        values: quarterValues,
        defaultWidth: 'wide',
        argumentCallback: (quarter) => quarter - 1,
    }),
    month: buildLocalizeFn({
        values: monthValues,
        defaultWidth: 'wide',
    }),
    day: buildLocalizeFn({
        values: dayValues,
        defaultWidth: 'wide',
    }),
    dayPeriod: buildLocalizeFn({
        values: dayPeriodValues,
        defaultWidth: 'wide',
    }),
};
const matchOrdinalNumberPattern = /^(\d+)\.?/i;
const parseOrdinalNumberPattern = /\d+/i;
const matchEraPatterns = {
    narrow: /^(f\.? ?Kr\.?|fvt\.?|e\.? ?Kr\.?|evt\.?)/i,
    abbreviated: /^(f\.? ?Kr\.?|fvt\.?|e\.? ?Kr\.?|evt\.?)/i,
    wide: /^(før Kristus|før vår tid|etter Kristus|vår tid)/i,
};
const parseEraPatterns = {
    any: [/^f/i, /^e/i],
};
const matchQuarterPatterns = {
    narrow: /^[1234]/i,
    abbreviated: /^q[1234]/i,
    wide: /^[1234](\.)? kvartal/i,
};
const parseQuarterPatterns = {
    any: [/1/i, /2/i, /3/i, /4/i],
};
const matchMonthPatterns = {
    narrow: /^[jfmasond]/i,
    abbreviated: /^(jan|feb|mars?|apr|mai|juni?|juli?|aug|sep|okt|nov|des)\.?/i,
    wide: /^(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)/i,
};
const parseMonthPatterns = {
    narrow: [
        /^j/i,
        /^f/i,
        /^m/i,
        /^a/i,
        /^m/i,
        /^j/i,
        /^j/i,
        /^a/i,
        /^s/i,
        /^o/i,
        /^n/i,
        /^d/i,
    ],
    any: [
        /^ja/i,
        /^f/i,
        /^mar/i,
        /^ap/i,
        /^mai/i,
        /^jun/i,
        /^jul/i,
        /^aug/i,
        /^s/i,
        /^o/i,
        /^n/i,
        /^d/i,
    ],
};
const matchDayPatterns = {
    narrow: /^[smtofl]/i,
    short: /^(sø|ma|ti|on|to|fr|lø)/i,
    abbreviated: /^(søn|man|tir|ons|tor|fre|lør)/i,
    wide: /^(søndag|mandag|tirsdag|onsdag|torsdag|fredag|lørdag)/i,
};
const parseDayPatterns = {
    any: [/^s/i, /^m/i, /^ti/i, /^o/i, /^to/i, /^f/i, /^l/i],
};
const matchDayPeriodPatterns = {
    narrow: /^(midnatt|middag|(på) (morgenen|ettermiddagen|kvelden|natten)|[ap])/i,
    any: /^([ap]\.?\s?m\.?|midnatt|middag|(på) (morgenen|ettermiddagen|kvelden|natten))/i,
};
const parseDayPeriodPatterns = {
    any: {
        am: /^a(\.?\s?m\.?)?$/i,
        pm: /^p(\.?\s?m\.?)?$/i,
        midnight: /^midn/i,
        noon: /^midd/i,
        morning: /morgen/i,
        afternoon: /ettermiddag/i,
        evening: /kveld/i,
        night: /natt/i,
    },
};
const match = {
    ordinalNumber: buildMatchPatternFn({
        matchPattern: matchOrdinalNumberPattern,
        parsePattern: parseOrdinalNumberPattern,
        valueCallback: (value) => parseInt(value, 10),
    }),
    era: buildMatchFn({
        matchPatterns: matchEraPatterns,
        defaultMatchWidth: 'wide',
        parsePatterns: parseEraPatterns,
        defaultParseWidth: 'any',
    }),
    quarter: buildMatchFn({
        matchPatterns: matchQuarterPatterns,
        defaultMatchWidth: 'wide',
        parsePatterns: parseQuarterPatterns,
        defaultParseWidth: 'any',
        valueCallback: (index) => index + 1,
    }),
    month: buildMatchFn({
        matchPatterns: matchMonthPatterns,
        defaultMatchWidth: 'wide',
        parsePatterns: parseMonthPatterns,
        defaultParseWidth: 'any',
    }),
    day: buildMatchFn({
        matchPatterns: matchDayPatterns,
        defaultMatchWidth: 'wide',
        parsePatterns: parseDayPatterns,
        defaultParseWidth: 'any',
    }),
    dayPeriod: buildMatchFn({
        matchPatterns: matchDayPeriodPatterns,
        defaultMatchWidth: 'any',
        parsePatterns: parseDayPeriodPatterns,
        defaultParseWidth: 'any',
    }),
};
const nb$1 = {
    code: 'nb',
    formatDistance,
    formatLong,
    formatRelative,
    localize,
    match,
    options: {
        weekStartsOn: 1,
        firstWeekContainsDate: 4,
    },
};
const nb = {
    global: {
        dateLocale: nb$1,
        /** @default "Vis mer" */
        showMore: 'Vis mer',
        /** @default "Vis mindre" */
        showLess: 'Vis mindre',
        /** @default "Skrivebeskyttet" */
        readOnly: 'Skrivebeskyttet',
        /** @default "Lukk" */
        close: 'Lukk',
        /** @default "Feil" */
        error: 'Feil',
        /** @default "Informasjon" */
        info: 'Informasjon',
        /** @default "Suksess" */
        success: 'Suksess',
        /** @default "Advarsel" */
        warning: 'Advarsel',
        /** @default "Kunngjøring" */
        announcement: 'Kunngjøring',
    },
    Chips: {
        Removable: {
            /** Will be appended to the accessible name for the button.
             * @default "slett" */
            labelSuffix: 'slett',
        },
    },
    Combobox: {
        /** The input value will be appended to the end of this text, e.g. `Legg til "input value"`.
         * @default "Legg til" */
        addOption: 'Legg til',
        /** @default "Ingen søketreff" */
        noMatches: 'Ingen søketreff',
        /** Loader title
         * @default "Søker…" */
        loading: 'Søker…',
        /** @default "{selected} av maks {limit} er valgt." */
        maxSelected: '{selected} av maks {limit} er valgt.',
    },
    CopyButton: {
        /** @default "Kopier" */
        title: 'Kopier',
        /** @default "Kopiert!" */
        activeText: 'Kopiert!',
    },
    DatePicker: {
        /** @default "Velg dato" */
        chooseDate: 'Velg dato',
        /** @default "Velg datoer" */
        chooseDates: 'Velg datoer',
        /** @default "Velg start- og sluttdato" */
        chooseDateRange: 'Velg start- og sluttdato',
        /** @default "Velg måned" */
        chooseMonth: 'Velg måned',
        /** @default "Uke" */
        week: 'Uke',
        /** @default "Uke {week}" */
        weekNumber: 'Uke {week}',
        /** @default "Velg uke {week}" */
        selectWeekNumber: 'Velg uke {week}',
        /** @default "Måned" */
        month: 'Måned',
        /** @default "Gå til neste måned" */
        goToNextMonth: 'Gå til neste måned',
        /** @default "Gå til forrige måned" */
        goToPreviousMonth: 'Gå til forrige måned',
        /** @default "År" */
        year: 'År',
        /** @default "Gå til neste år" */
        goToNextYear: 'Gå til neste år',
        /** @default "Gå til forrige år" */
        goToPreviousYear: 'Gå til forrige år',
        /** @default "Åpne datovelger" */
        openDatePicker: 'Åpne datovelger',
        /** @default "Åpne månedsvelger" */
        openMonthPicker: 'Åpne månedsvelger',
        /** @default "Lukk datovelger" */
        closeDatePicker: 'Lukk datovelger',
        /** @default "Lukk månedsvelger" */
        closeMonthPicker: 'Lukk månedsvelger',
    },
    ErrorSummary: {
        /** @default "Du må rette disse feilene før du kan fortsette:" */
        heading: 'Du må rette disse feilene før du kan fortsette:',
    },
    FileUpload: {
        dropzone: {
            /** @default "Velg fil" */
            button: 'Velg fil',
            /** @default "Velg filer" */
            buttonMultiple: 'Velg filer',
            /** @default "Dra og slipp filen her" */
            dragAndDrop: 'Dra og slipp filen her',
            /** @default "Dra og slipp filer her" */
            dragAndDropMultiple: 'Dra og slipp filer her',
            /** @default "Slipp" */
            drop: 'Slipp',
            /** @default "eller" */
            or: 'eller',
            /** @default "Filopplasting er deaktivert" */
            disabled: 'Filopplasting er deaktivert',
            /** @default "Du kan ikke laste opp flere filer" */
            disabledFilelimit: 'Du kan ikke laste opp flere filer',
        },
        item: {
            /** @default "Prøv å laste opp filen på nytt" */
            retryButtonTitle: 'Prøv å laste opp filen på nytt',
            /** @default "Slett filen" */
            deleteButtonTitle: 'Slett filen',
            /** @default "Laster opp…" */
            uploading: 'Laster opp…',
            /** @default "Laster ned…" */
            downloading: 'Laster ned…',
        },
    },
    FormProgress: {
        /** @default "Steg {activeStep} av {totalSteps}" */
        step: 'Steg {activeStep} av {totalSteps}',
        /** @default "Vis alle steg" */
        showAllSteps: 'Vis alle steg',
        /** @default "Skjul alle steg" */
        hideAllSteps: 'Skjul alle steg',
    },
    FormSummary: {
        /** @default "Endre svar" */
        editAnswer: 'Endre svar',
    },
    GuidePanel: {
        /** @default "Illustrasjon av veileder" */
        illustrationLabel: 'Illustrasjon av veileder',
    },
    HelpText: {
        /** @default "Mer informasjon" */
        title: 'Mer informasjon',
    },
    Loader: {
        /** @default "Venter…" */
        title: 'Venter…',
    },
    Pagination: {
        /** @default "Forrige" */
        previous: 'Forrige',
        /** @default "Neste" */
        next: 'Neste',
    },
    Process: {
        /** @default "Aktiv" */
        active: 'Aktiv',
    },
    ProgressBar: {
        /** @default "{current} av {max}" */
        progress: '{current} av {max}',
        /** @default "Fremdrift kan ikke beregnes, antatt tid er {seconds} sekunder." */
        progressUnknown:
            'Fremdrift kan ikke beregnes, antatt tid er {seconds} sekunder.',
    },
    Search: {
        /** @default "Tøm feltet" */
        clear: 'Tøm feltet',
        /** @default "Søk" */
        search: 'Søk',
    },
    Textarea: {
        /** Screen readers only
         * @default "Tekstområde med plass til {maxLength} tegn." */
        maxLength: 'Tekstområde med plass til {maxLength} tegn.',
        /** @default "{chars} tegn for mye" */
        charsTooMany: '{chars} tegn for mye',
        /** @default "{chars} tegn igjen" */
        charsLeft: '{chars} tegn igjen',
    },
    Timeline: {
        /** @default "dd.MM.yyyy" */
        dateFormat: 'dd.MM.yyyy',
        /** @default "dd.MM" */
        dayFormat: 'dd.MM',
        /** @default "MMM yy" */
        monthFormat: 'MMM yy',
        /** @default "yyyy" */
        yearFormat: 'yyyy',
        Row: {
            /** @default "Ingen perioder" */
            noPeriods: 'Ingen perioder',
            /** @default "{start} til {end}" */
            period: '{start} til {end}',
        },
        Period: {
            /** @default "Suksess" */
            success: 'Suksess',
            /** @default "Advarsel" */
            warning: 'Advarsel',
            /** @default "Fare" */
            danger: 'Fare',
            /** @default "Info" */
            info: 'Info',
            /** @default "Nøytral" */
            neutral: 'Nøytral',
            /** @default "{status} fra {start} til {end}" */
            period: '{status} fra {start} til {end}',
        },
        Pin: {
            /** @default "Pin: {date}" */
            pin: 'Pin: {date}',
        },
        Zoom: {
            /** @default "Zoom tidslinjen {start} til {end}" */
            zoom: 'Zoom tidslinjen {start} til {end}',
            /** @default "Tilbakestill tidsperspektiv" */
            reset: 'Tilbakestill tidsperspektiv',
        },
    },
};
const ProviderContext = createContext({
    locale: nb,
});
const useProvider = () => useContext(ProviderContext);
const OBJECT_NOTATION_MATCHER = /(\w+)/g;
function get(keypath, objs) {
    const keys = Array.isArray(keypath) ? keypath : getKeypath(keypath);
    for (const obj of objs) {
        if (!obj) {
            continue;
        }
        let acc = obj;
        for (let i = 0; i < keys.length; i++) {
            const val = acc[keys[i]];
            if (val === void 0) {
                continue;
            }
            acc = val;
        }
        if (typeof acc === 'string') {
            return acc;
        }
    }
    throw new Error(
        `Error translating key. Keypath '${keypath}' does not resolve to a string.`
    );
}
function getKeypath(str) {
    const path = [];
    let result = OBJECT_NOTATION_MATCHER.exec(str);
    while (result) {
        const [, first, second] = result;
        path.push(first || second);
        result = OBJECT_NOTATION_MATCHER.exec(str);
    }
    return path;
}
const REPLACE_REGEX = /{[^}]*}/g;
function useI18n(componentName, ...localTranslations) {
    const context = useProvider();
    const contextTranslations = context.translations || [];
    const i18nObjects = [
        ...localTranslations,
        ...(Array.isArray(contextTranslations)
            ? contextTranslations.map((t) => t[componentName])
            : [contextTranslations[componentName]]),
        context.locale[componentName],
    ];
    const translate = (keypath, replacements) => {
        const text = get(keypath, i18nObjects);
        if (replacements) {
            return text.replace(REPLACE_REGEX, (match2) => {
                const replacement = match2.substring(1, match2.length - 1);
                if (replacements[replacement] === void 0) {
                    const replacementData = JSON.stringify(replacements);
                    throw new Error(
                        `Error translating key '${keypath}'. No replacement syntax ({}) found for key '${replacement}'. The following replacements were passed: '${replacementData}'`
                    );
                }
                return replacements[replacement];
            });
        }
        return text;
    };
    return translate;
}
var __rest$5 = function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
        for (
            var i = 0, p = Object.getOwnPropertySymbols(s);
            i < p.length;
            i++
        ) {
            if (
                e.indexOf(p[i]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(s, p[i])
            )
                t[p[i]] = s[p[i]];
        }
    return t;
};
const Loader = forwardRef((_a, ref) => {
    var {
            className,
            size = 'medium',
            title: title2,
            transparent = false,
            variant = 'neutral',
            id,
            'data-color': color,
        } = _a,
        rest = __rest$5(_a, [
            'className',
            'size',
            'title',
            'transparent',
            'variant',
            'id',
            'data-color',
        ]);
    const { cn } = useRenameCSS();
    const internalId = useId$1();
    const translate = useI18n('Loader');
    return React.createElement(
        'svg',
        Object.assign(
            {
                'aria-labelledby':
                    id !== null && id !== void 0 ? id : `loader-${internalId}`,
                ref,
                className: cn(
                    'navds-loader',
                    className,
                    `navds-loader--${size}`,
                    `navds-loader--${variant}`,
                    {
                        'navds-loader--transparent': transparent,
                    }
                ),
                focusable: 'false',
                viewBox: '0 0 50 50',
                preserveAspectRatio: 'xMidYMid',
                'data-color':
                    color !== null && color !== void 0
                        ? color
                        : variantToColor$2(variant),
            },
            omit(rest, ['children']),
            { 'data-variant': variant }
        ),
        React.createElement(
            'title',
            { id: id !== null && id !== void 0 ? id : `loader-${internalId}` },
            title2 || translate('title')
        ),
        React.createElement('circle', {
            className: cn('navds-loader__background'),
            xmlns: 'http://www.w3.org/2000/svg',
            cx: '25',
            cy: '25',
            r: '20',
            fill: 'none',
        }),
        React.createElement('circle', {
            className: cn('navds-loader__foreground'),
            cx: '25',
            cy: '25',
            r: '20',
            fill: 'none',
            strokeDasharray: '50 155',
        })
    );
});
function variantToColor$2(variant) {
    switch (variant) {
        case 'neutral':
            return 'neutral';
        case 'inverted':
            return 'neutral';
        /* We assume "interaction" is the main app color in this instance */
        case 'interaction':
            return void 0;
        default:
            return 'neutral';
    }
}
var __rest$4 = function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
        for (
            var i = 0, p = Object.getOwnPropertySymbols(s);
            i < p.length;
            i++
        ) {
            if (
                e.indexOf(p[i]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(s, p[i])
            )
                t[p[i]] = s[p[i]];
        }
    return t;
};
const Button = forwardRef((_a, ref) => {
    var {
            as: Component = 'button',
            variant = 'primary',
            className,
            children,
            size = 'medium',
            loading = false,
            disabled,
            icon,
            iconPosition = 'left',
            onKeyUp,
            'data-color': color,
        } = _a,
        rest = __rest$4(_a, [
            'as',
            'variant',
            'className',
            'children',
            'size',
            'loading',
            'disabled',
            'icon',
            'iconPosition',
            'onKeyUp',
            'data-color',
        ]);
    const { cn } = useRenameCSS();
    const filterProps = disabled || loading ? omit(rest, ['href']) : rest;
    const handleKeyUp = (e) => {
        if (e.key === ' ' && !disabled && !loading) {
            e.currentTarget.click();
        }
    };
    return React.createElement(
        Component,
        Object.assign(
            {},
            Component !== 'button' ? { role: 'button' } : {},
            {
                'data-color':
                    color !== null && color !== void 0
                        ? color
                        : variantToColor$1(variant),
                'data-variant': variantToSimplifiedVariant(variant),
            },
            filterProps,
            {
                ref,
                onKeyUp: composeEventHandlers(onKeyUp, handleKeyUp),
                className: cn(
                    className,
                    'navds-button',
                    `navds-button--${variant}`,
                    `navds-button--${size}`,
                    {
                        'navds-button--loading': loading,
                        'navds-button--icon-only': !!icon && !children,
                        'navds-button--disabled':
                            disabled !== null && disabled !== void 0
                                ? disabled
                                : loading,
                    }
                ),
                disabled: (
                    disabled !== null && disabled !== void 0
                        ? disabled
                        : loading
                )
                    ? true
                    : void 0,
            }
        ),
        icon &&
            iconPosition === 'left' &&
            React.createElement(
                'span',
                { className: cn('navds-button__icon') },
                icon
            ),
        loading && React.createElement(Loader, { size }),
        children &&
            React.createElement(
                Label,
                { as: 'span', size: size === 'medium' ? 'medium' : 'small' },
                children
            ),
        icon &&
            iconPosition === 'right' &&
            React.createElement(
                'span',
                { className: cn('navds-button__icon') },
                icon
            )
    );
});
function variantToColor$1(variant) {
    switch (variant) {
        case 'primary-neutral':
        case 'secondary-neutral':
        case 'tertiary-neutral':
            return 'neutral';
        case 'danger':
            return 'danger';
        default:
            return void 0;
    }
}
function variantToSimplifiedVariant(variant) {
    switch (variant) {
        case 'primary':
        case 'primary-neutral':
        case 'danger':
            return 'primary';
        case 'secondary':
        case 'secondary-neutral':
            return 'secondary';
        case 'tertiary':
        case 'tertiary-neutral':
            return 'tertiary';
        default:
            return 'primary';
    }
}
var __rest$3 = function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
        for (
            var i = 0, p = Object.getOwnPropertySymbols(s);
            i < p.length;
            i++
        ) {
            if (
                e.indexOf(p[i]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(s, p[i])
            )
                t[p[i]] = s[p[i]];
        }
    return t;
};
const ReadMore = forwardRef((_a, ref) => {
    var {
            className,
            header: header2,
            children,
            open,
            defaultOpen = false,
            onClick,
            size = 'medium',
            onOpenChange,
        } = _a,
        rest = __rest$3(_a, [
            'className',
            'header',
            'children',
            'open',
            'defaultOpen',
            'onClick',
            'size',
            'onOpenChange',
        ]);
    const { cn } = useRenameCSS();
    const [_open, _setOpen] = useControllableState({
        defaultValue: defaultOpen,
        value: open,
        onChange: onOpenChange,
    });
    const typoSize = size === 'small' ? 'small' : 'medium';
    return React.createElement(
        'div',
        {
            className: cn(
                'navds-read-more',
                `navds-read-more--${size}`,
                className,
                { 'navds-read-more--open': _open }
            ),
            'data-volume': 'low',
        },
        React.createElement(
            'button',
            Object.assign({}, rest, {
                ref,
                type: 'button',
                className: cn('navds-read-more__button', 'navds-body-short', {
                    'navds-body-short--small': size === 'small',
                }),
                onClick: composeEventHandlers(onClick, () =>
                    _setOpen((x) => !x)
                ),
                'aria-expanded': _open,
                'data-state': _open ? 'open' : 'closed',
            }),
            React.createElement(SvgChevronDown, {
                className: cn('navds-read-more__expand-icon'),
                'aria-hidden': true,
            }),
            React.createElement('span', null, header2)
        ),
        React.createElement(
            BodyLong,
            {
                as: 'div',
                tabIndex: 0,
                className: cn('navds-read-more__content', {
                    'navds-read-more__content--closed': !_open,
                }),
                size: typoSize,
                'data-state': _open ? 'open' : 'closed',
            },
            children
        )
    );
});
const FieldsetContext = createContext(null);
const useFormField = (props, prefix) => {
    var _a, _b, _c;
    const { size, error: error2, errorId: propErrorId } = props;
    const fieldset = useContext(FieldsetContext);
    const genId = useId$1();
    const id =
        (_a = props.id) !== null && _a !== void 0 ? _a : `${prefix}-${genId}`;
    const errorId =
        propErrorId !== null && propErrorId !== void 0
            ? propErrorId
            : `${prefix}-error-${genId}`;
    const inputDescriptionId = `${prefix}-description-${genId}`;
    const disabled =
        (fieldset === null || fieldset === void 0
            ? void 0
            : fieldset.disabled) || props.disabled;
    const readOnly =
        (((fieldset === null || fieldset === void 0
            ? void 0
            : fieldset.readOnly) ||
            props.readOnly) &&
            !disabled) ||
        void 0;
    const hasError =
        !disabled &&
        !readOnly &&
        !!(
            error2 ||
            (fieldset === null || fieldset === void 0 ? void 0 : fieldset.error)
        );
    const showErrorMsg =
        !disabled && !readOnly && !!error2 && typeof error2 !== 'boolean';
    const ariaInvalid = Object.assign(
        {},
        hasError ? { 'aria-invalid': true } : {}
    );
    if (
        (props === null || props === void 0 ? void 0 : props.required) &&
        process.env.NODE_ENV !== 'production'
    ) {
        console.warn(
            "Aksel: Use of 'required' in form-elements is heavily discuouraged. Docs about why here:"
        );
        console.warn(
            'https://aksel.nav.no/god-praksis/artikler/obligatoriske-og-valgfrie-skjemafelter#dc7a536235fa'
        );
    }
    return {
        showErrorMsg,
        hasError,
        errorId,
        inputDescriptionId,
        size:
            (_b =
                size !== null && size !== void 0
                    ? size
                    : fieldset === null || fieldset === void 0
                      ? void 0
                      : fieldset.size) !== null && _b !== void 0
                ? _b
                : 'medium',
        readOnly,
        inputProps: Object.assign(Object.assign({ id }, ariaInvalid), {
            'aria-describedby':
                clsx(props['aria-describedby'], {
                    [inputDescriptionId]:
                        props.description &&
                        !containsReadMore(props.description),
                    [errorId]: showErrorMsg,
                    [(_c =
                        fieldset === null || fieldset === void 0
                            ? void 0
                            : fieldset.errorId) !== null && _c !== void 0
                        ? _c
                        : '']:
                        hasError &&
                        (fieldset === null || fieldset === void 0
                            ? void 0
                            : fieldset.error),
                }) || void 0,
            disabled,
        }),
    };
};
function containsReadMore(children, checkNested = true) {
    if (React.isValidElement(children)) {
        if (children.type === ReadMore) {
            return true;
        }
        if (children.props.children && checkNested) {
            return containsReadMore(children.props.children, false);
        }
    } else if (Array.isArray(children)) {
        return children.some((child) => containsReadMore(child, checkNested));
    }
    return false;
}
var __rest$2 = function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
        for (
            var i = 0, p = Object.getOwnPropertySymbols(s);
            i < p.length;
            i++
        ) {
            if (
                e.indexOf(p[i]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(s, p[i])
            )
                t[p[i]] = s[p[i]];
        }
    return t;
};
const Link = forwardRef((_a, ref) => {
    var {
            as: Component = 'a',
            className,
            underline = true,
            variant,
            inlineText = false,
            'data-color': color,
        } = _a,
        rest = __rest$2(_a, [
            'as',
            'className',
            'underline',
            'variant',
            'inlineText',
            'data-color',
        ]);
    const themeContext = useThemeInternal();
    const { cn } = useRenameCSS();
    let localVariant;
    if (
        themeContext === null || themeContext === void 0
            ? void 0
            : themeContext.isDarkside
    ) {
        localVariant = variant;
    } else {
        localVariant =
            variant !== null && variant !== void 0 ? variant : 'action';
    }
    return React.createElement(
        Component,
        Object.assign(
            {
                'data-color':
                    color !== null && color !== void 0
                        ? color
                        : variantToColor(localVariant),
                'data-variant': localVariant,
            },
            rest,
            {
                ref,
                className: cn('navds-link', className, {
                    [`navds-link--${localVariant}`]: localVariant,
                    'navds-link--remove-underline': !underline,
                    'navds-link--inline-text': inlineText,
                }),
            }
        )
    );
});
function variantToColor(variant) {
    switch (variant) {
        case 'action':
            return 'accent';
        case 'neutral':
            return 'neutral';
        case 'subtle':
            return 'neutral';
        default:
            return void 0;
    }
}
const SearchContext = createContext(null);
var __rest$1 = function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
        for (
            var i = 0, p = Object.getOwnPropertySymbols(s);
            i < p.length;
            i++
        ) {
            if (
                e.indexOf(p[i]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(s, p[i])
            )
                t[p[i]] = s[p[i]];
        }
    return t;
};
const SearchButton = forwardRef((_a, ref) => {
    var _b;
    var { className, children, disabled, onClick } = _a,
        rest = __rest$1(_a, ['className', 'children', 'disabled', 'onClick']);
    const { cn } = useRenameCSS();
    const translate = useI18n('Search');
    const context = useContext(SearchContext);
    if (context === null) {
        console.warn('<Search.Button> has to be wrapped in <Search />');
        return null;
    }
    const { size, variant, handleClick } = context;
    return React.createElement(
        Button,
        Object.assign({ type: 'submit' }, rest, {
            ref,
            size,
            variant: variant === 'secondary' ? 'secondary' : 'primary',
            className: cn('navds-search__button-search', className),
            disabled:
                (_b =
                    context === null || context === void 0
                        ? void 0
                        : context.disabled) !== null && _b !== void 0
                    ? _b
                    : disabled,
            onClick: composeEventHandlers(onClick, handleClick),
            icon: React.createElement(
                SvgMagnifyingGlass,
                Object.assign(
                    {},
                    children
                        ? { 'aria-hidden': true }
                        : { title: translate('search') }
                )
            ),
        }),
        children
    );
});
var __rest = function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
        for (
            var i = 0, p = Object.getOwnPropertySymbols(s);
            i < p.length;
            i++
        ) {
            if (
                e.indexOf(p[i]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(s, p[i])
            )
                t[p[i]] = s[p[i]];
        }
    return t;
};
const Search = forwardRef((props, ref) => {
    const {
        inputProps,
        size = 'medium',
        inputDescriptionId,
        errorId,
        showErrorMsg,
        hasError,
    } = useFormField(props, 'searchfield');
    const {
            className,
            hideLabel = true,
            label,
            description,
            value,
            clearButtonLabel,
            onClear,
            clearButton = true,
            children,
            variant = 'primary',
            defaultValue,
            onChange,
            onSearchClick,
            htmlSize,
            'data-color': dataColor,
        } = props,
        rest = __rest(props, [
            'className',
            'hideLabel',
            'label',
            'description',
            'value',
            'clearButtonLabel',
            'onClear',
            'clearButton',
            'children',
            'variant',
            'defaultValue',
            'onChange',
            'onSearchClick',
            'htmlSize',
            'data-color',
        ]);
    const { cn } = useRenameCSS();
    const searchRef = useRef(null);
    const mergedRef = useMergeRefs(searchRef, ref);
    const [internalValue, setInternalValue] = useState(
        defaultValue !== null && defaultValue !== void 0 ? defaultValue : ''
    );
    const handleChange = (newValue) => {
        value === void 0 && setInternalValue(newValue);
        onChange === null || onChange === void 0 ? void 0 : onChange(newValue);
    };
    const handleClear = (clearEvent) => {
        var _a, _b;
        onClear === null || onClear === void 0 ? void 0 : onClear(clearEvent);
        handleChange('');
        (_b =
            (_a = searchRef.current) === null || _a === void 0
                ? void 0
                : _a.focus) === null || _b === void 0
            ? void 0
            : _b.call(_a);
    };
    const handleClick = () => {
        onSearchClick === null || onSearchClick === void 0
            ? void 0
            : onSearchClick(
                  `${value !== null && value !== void 0 ? value : internalValue}`
              );
    };
    const showClearButton =
        clearButton &&
        !inputProps.disabled &&
        (value !== null && value !== void 0 ? value : internalValue);
    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: Escape key handler for clearing input
        React.createElement(
            'div',
            {
                onKeyDown: (event) => {
                    var _a;
                    if (event.key !== 'Escape') {
                        return;
                    }
                    ((_a = searchRef.current) === null || _a === void 0
                        ? void 0
                        : _a.value) && event.preventDefault();
                    handleClear({ trigger: 'Escape', event });
                },
                className: cn(
                    className,
                    'navds-form-field',
                    `navds-form-field--${size}`,
                    'navds-search',
                    {
                        'navds-search--error': hasError,
                        'navds-search--disabled': inputProps.disabled,
                        'navds-search--with-size': htmlSize,
                    }
                ),
                'data-color': dataColor,
            },
            React.createElement(
                Label,
                {
                    htmlFor: inputProps.id,
                    size,
                    className: cn('navds-form-field__label', {
                        'navds-sr-only': hideLabel,
                    }),
                },
                label
            ),
            !!description &&
                React.createElement(
                    BodyShort,
                    {
                        className: cn('navds-form-field__description', {
                            'navds-sr-only': hideLabel,
                        }),
                        id: inputDescriptionId,
                        size,
                        as: 'div',
                    },
                    description
                ),
            React.createElement(
                'div',
                { className: cn('navds-search__wrapper') },
                React.createElement(
                    'div',
                    { className: cn('navds-search__wrapper-inner') },
                    variant === 'simple' &&
                        React.createElement(SvgMagnifyingGlass, {
                            'aria-hidden': true,
                            className: cn('navds-search__search-icon'),
                        }),
                    React.createElement(
                        'input',
                        Object.assign(
                            { ref: mergedRef },
                            omit(rest, [
                                'error',
                                'errorId',
                                'size',
                                'readOnly',
                            ]),
                            inputProps,
                            {
                                value:
                                    value !== null && value !== void 0
                                        ? value
                                        : internalValue,
                                onChange: (e) => handleChange(e.target.value),
                                type: 'search',
                                className: cn(
                                    className,
                                    'navds-search__input',
                                    `navds-search__input--${variant}`,
                                    'navds-text-field__input',
                                    'navds-body-short',
                                    `navds-body-short--${size}`
                                ),
                            },
                            htmlSize ? { size: Number(htmlSize) } : {}
                        )
                    ),
                    showClearButton &&
                        React.createElement(ClearButton, {
                            handleClear,
                            size,
                            clearButtonLabel,
                        })
                ),
                React.createElement(
                    SearchContext.Provider,
                    {
                        value: {
                            size,
                            disabled: inputProps.disabled,
                            variant,
                            handleClick,
                        },
                    },
                    children
                        ? children
                        : variant !== 'simple' &&
                              React.createElement(SearchButton, {
                                  'data-color': dataColor,
                              })
                )
            ),
            React.createElement(
                'div',
                {
                    className: cn('navds-form-field__error'),
                    id: errorId,
                    'aria-relevant': 'additions removals',
                    'aria-live': 'polite',
                },
                showErrorMsg &&
                    React.createElement(
                        ErrorMessage,
                        { size, showIcon: true },
                        props.error
                    )
            )
        )
    );
});
function ClearButton({ size, clearButtonLabel, handleClear }) {
    const { cn } = useRenameCSS();
    const themeContext = useThemeInternal();
    const translate = useI18n('Search');
    return (
        themeContext === null || themeContext === void 0
            ? void 0
            : themeContext.isDarkside
    )
        ? React.createElement(Button, {
              className: cn('navds-search__button-clear'),
              variant: 'tertiary',
              'data-color': 'neutral',
              size: size === 'medium' ? 'small' : 'xsmall',
              icon: React.createElement(SvgXMark, { 'aria-hidden': true }),
              title: clearButtonLabel || translate('clear'),
              onClick: (event) => handleClear({ trigger: 'Click', event }),
              type: 'button',
          })
        : React.createElement(
              'button',
              {
                  type: 'button',
                  onClick: (event) => handleClear({ trigger: 'Click', event }),
                  className: cn('navds-search__button-clear'),
              },
              React.createElement(
                  'span',
                  { className: cn('navds-sr-only') },
                  clearButtonLabel || translate('clear')
              ),
              React.createElement(SvgXMark, { 'aria-hidden': true })
          );
}
Search.Button = SearchButton;
const LocaleContext = createContext('nb');
const useLocale = () => {
    return useContext(LocaleContext);
};
const LocaleProvider = (props) => {
    return /* @__PURE__ */ jsx(LocaleContext.Provider, { ...props });
};
const localeModuleNb = {
    documentTitle: 'Søk opp Nav-kontor - nav.no',
    pageTitle: 'Søk opp Nav-kontor',
    breadcrumb1: 'Kontakt oss',
    breadcrumb2: 'Søk opp Nav-kontor',
    ingressLine1:
        'Mangler du elektronisk ID? Eller skal du finne Nav-kontor på vegne av noen andre?',
    ingressLine2:
        'Da kan du søke opp Nav-kontor ved hjelp av postnummer eller sted/by.',
    inputLabel: 'Skriv inn et postnummer eller stedsnavn:',
    inputSubmit: 'Søk',
    errorMissingQuery: 'Mangler søke-streng',
    errorInvalidQuery: 'Feil i søke-streng',
    errorInvalidPostnr: 'Postnummeret finnes ikke',
    errorServerError: 'Ukjent server-feil',
    errorInvalidResult: 'Server-feil: Feil i søke-resultatet',
    errorInputValidationLength:
        'Skriv inn minst to bokstaver eller et postnummer',
    errorInputValidationPostnr: 'Postnummer-søk må være fire siffer',
    errorInputValidationName: 'Søket inneholder ugyldige tegn',
    nameResultHeader: 'Søkeresultat for ',
    postnrResultNone: (postnrOgPoststed, adresseQuery) =>
        /* @__PURE__ */ jsxs(Fragment, {
            children: [
                `Ingen Nav-kontor funnet for `,
                /* @__PURE__ */ jsx('strong', { children: postnrOgPoststed }),
                adresseQuery && ` med gatenavn ${adresseQuery}`,
            ],
        }),
    postnrResultOne: (postnrOgPoststed) =>
        /* @__PURE__ */ jsxs(Fragment, {
            children: [
                'Nav-kontor for ',
                /* @__PURE__ */ jsx('strong', { children: postnrOgPoststed }),
                ':',
            ],
        }),
    postnrResultMany: (numHits, postnrOgPoststed, postnr) =>
        /* @__PURE__ */ jsxs(Fragment, {
            children: [
                `${numHits} kontorer dekker `,
                /* @__PURE__ */ jsx('strong', { children: postnrOgPoststed }),
                `. Du kan legge til gatenavn og husnummer for å spisse søket, f.eks. ${postnr} Eksempelgata 12`,
            ],
        }),
    postnrResultPostbox: (postnr, kommuneNavn, numHits) =>
        /* @__PURE__ */ jsxs(Fragment, {
            children: [
                `${postnr} er et postnummer for postbokser i `,
                /* @__PURE__ */ jsx('strong', { children: kommuneNavn }),
                ` kommune. Kommunens Nav-kontor${Number(numHits) > 1 ? 'er' : ''}:`,
            ],
        }),
    postnrResultServiceBox: (postnr, kommuneNavn, numHits) =>
        /* @__PURE__ */ jsxs(Fragment, {
            children: [
                `${postnr} er et servicepostnummer i `,
                /* @__PURE__ */ jsx('strong', { children: kommuneNavn }),
                ` kommune. Kommunens Nav-kontor${Number(numHits) > 1 ? 'er' : ''}:`,
            ],
        }),
    postnrResultBydeler: (postnr, kommuneNavn, numHits) =>
        /* @__PURE__ */ jsxs(Fragment, {
            children: [
                'Fant ingen kontor spesifikt tilknyttet ',
                /* @__PURE__ */ jsx('strong', { children: postnr }),
                ' i ',
                /* @__PURE__ */ jsx('strong', { children: kommuneNavn }),
                ` kommune. ${Number(numHits) > 1 ? 'Alle k' : 'K'}ommunens Nav-kontor${Number(numHits) > 1 ? 'er' : ''}:`,
            ],
        }),
    nameResultNone: (input) => `Ingen resultater for "${input}"`,
    nameResultFound: (input, numHits) =>
        `Søkeresultat for "${input}" (${numHits}):`,
};
const localeModuleNn = {
    documentTitle: 'Søk opp Nav-kontor - nav.no',
    pageTitle: 'Søk opp Nav-kontor',
    breadcrumb1: 'Kontakt oss',
    breadcrumb2: 'Søk opp Nav-kontor',
    ingressLine1:
        'Manglar du elektronisk ID? Eller skal du finne Nav-kontor på vegne av nokon andre?',
    ingressLine2:
        'Då kan du søke opp Nav-kontor ved hjelp av postnummer eller stad/by.',
    inputLabel: 'Skriv inn eit postnummer eller stadnamn:',
    inputSubmit: 'Søk',
    errorMissingQuery: 'Manglar søke-streng',
    errorInvalidQuery: 'Feil i søke-streng',
    errorInvalidPostnr: 'Postnummeret finns ikkje',
    errorServerError: 'Ukjent server-feil',
    errorInvalidResult: 'Server-feil: Feil i søke-resultatet',
    errorInputValidationLength:
        'Skriv inn minst to bokstavar eller eit postnummer',
    errorInputValidationPostnr: 'Postnummer-søk må vere fire siffer',
    errorInputValidationName: 'Søket inneheld ugyldige teikn',
    nameResultHeader: 'Søkeresultat for ',
    postnrResultNone: (postnrOgPoststed, adresseQuery) =>
        /* @__PURE__ */ jsxs(Fragment, {
            children: [
                `Ingen Nav-kontor funne for `,
                /* @__PURE__ */ jsx('strong', { children: postnrOgPoststed }),
                adresseQuery && ` med gatenamn ${adresseQuery}`,
            ],
        }),
    postnrResultOne: (postnrOgPoststed) =>
        /* @__PURE__ */ jsxs(Fragment, {
            children: [
                'Nav-kontor for ',
                /* @__PURE__ */ jsx('strong', { children: postnrOgPoststed }),
                ':',
            ],
        }),
    postnrResultMany: (numHits, postnrOgPoststed, postnr) =>
        /* @__PURE__ */ jsxs(Fragment, {
            children: [
                `${numHits} kontor dekker `,
                /* @__PURE__ */ jsx('strong', { children: postnrOgPoststed }),
                `. Du kan legge til gatenamn og husnummer for å spisse søket, t.d. ${postnr} Eksempelgata 12`,
            ],
        }),
    postnrResultPostbox: (postnr, kommuneNavn, numHits) =>
        /* @__PURE__ */ jsxs(Fragment, {
            children: [
                `${postnr} er eit postnummer for postboksar i `,
                /* @__PURE__ */ jsx('strong', { children: kommuneNavn }),
                ` kommune. Kommunens Nav-kontor${Number(numHits) > 1 ? 'er' : ''}:`,
            ],
        }),
    postnrResultServiceBox: (postnr, kommuneNavn, numHits) =>
        /* @__PURE__ */ jsxs(Fragment, {
            children: [
                `${postnr} er eit servicepostnummer i `,
                /* @__PURE__ */ jsx('strong', { children: kommuneNavn }),
                ` kommune. Kommunens Nav-kontor${Number(numHits) > 1 ? 'er' : ''}:`,
            ],
        }),
    postnrResultBydeler: (postnr, kommuneNavn, numHits) =>
        /* @__PURE__ */ jsxs(Fragment, {
            children: [
                'Fant ingen kontor spesifikt knytta til ',
                /* @__PURE__ */ jsx('strong', { children: postnr }),
                ' i ',
                /* @__PURE__ */ jsx('strong', { children: kommuneNavn }),
                ` kommune. ${Number(numHits) > 1 ? 'Alle k' : 'K'}ommunens Nav-kontor${Number(numHits) > 1 ? 'er' : ''}:`,
            ],
        }),
    nameResultNone: (input) => `Ingen resultat for "${input}"`,
    nameResultFound: (input, numHits) =>
        `Søkeresultat for "${input}" (${numHits}):`,
};
const localeModuleEn = {
    documentTitle: 'Find a Nav office - nav.no',
    pageTitle: 'Find a Nav office',
    breadcrumb1: 'Contact us',
    breadcrumb2: 'Find a Nav office',
    ingressLine1:
        'Do you not have electronic ID? Or are you trying to find the Nav office on behalf of someone else?',
    ingressLine2:
        'If so, you can find a Nav office using a post code or town/city.',
    inputLabel: 'Enter a post code or town/city:',
    inputSubmit: 'Search',
    errorMissingQuery: 'Missing search query',
    errorInvalidQuery: 'Invalid search query',
    errorInvalidPostnr: 'The post code does not exist',
    errorServerError: 'Unknown server error',
    errorInvalidResult: 'Server error: invalid search result',
    errorInputValidationLength:
        'Enter at least two letters or a valid post code',
    errorInputValidationPostnr: 'Post code search must be four digits',
    errorInputValidationName: 'Invalid characters in search',
    nameResultHeader: 'Search results for ',
    postnrResultNone: (postnrOgPoststed, adresseQuery) =>
        /* @__PURE__ */ jsxs(Fragment, {
            children: [
                `No Nav office found for `,
                /* @__PURE__ */ jsx('strong', { children: postnrOgPoststed }),
                adresseQuery && ` with street name ${adresseQuery}`,
            ],
        }),
    postnrResultOne: (postnrOgPoststed) =>
        /* @__PURE__ */ jsxs(Fragment, {
            children: [
                'Nav office for ',
                /* @__PURE__ */ jsx('strong', { children: postnrOgPoststed }),
                ':',
            ],
        }),
    postnrResultMany: (numHits, postnrOgPoststed, postnr) =>
        /* @__PURE__ */ jsxs(Fragment, {
            children: [
                `${numHits} offices cover `,
                /* @__PURE__ */ jsx('strong', { children: postnrOgPoststed }),
                `. You can add a street name and building number to narrow the search, e.g. ${postnr} Example-street 12`,
            ],
        }),
    postnrResultPostbox: (postnr, kommuneNavn, numHits) =>
        /* @__PURE__ */ jsxs(Fragment, {
            children: [
                `${postnr} is a post code for PO boxes in `,
                /* @__PURE__ */ jsx('strong', { children: kommuneNavn }),
                `. Nav office${Number(numHits) > 1 ? 's' : ''} for this town/city:`,
            ],
        }),
    postnrResultServiceBox: (postnr, kommuneNavn, numHits) =>
        /* @__PURE__ */ jsxs(Fragment, {
            children: [
                `${postnr} is a service post code in `,
                /* @__PURE__ */ jsx('strong', { children: kommuneNavn }),
                `. Nav office${Number(numHits) > 1 ? 's' : ''} for this town/city:`,
            ],
        }),
    postnrResultBydeler: (postnr, kommuneNavn, numHits) =>
        /* @__PURE__ */ jsxs(Fragment, {
            children: [
                'No specific office found for ',
                /* @__PURE__ */ jsx('strong', { children: postnr }),
                ' in ',
                /* @__PURE__ */ jsx('strong', { children: kommuneNavn }),
                `. ${Number(numHits) > 1 ? 'All ' : ''}Nav office${Number(numHits) > 1 ? 's' : ''} for this town/city:`,
            ],
        }),
    nameResultNone: (input) => `No results for "${input}"`,
    nameResultFound: (input, numHits) =>
        `Search results for "${input}" (${numHits}):`,
};
const localeModules = {
    nb: localeModuleNb,
    nn: localeModuleNn,
    en: localeModuleEn,
};
const localeString = (id, locale, args = []) => {
    const value = localeModules[locale][id];
    return typeof value === 'function' ? value(...args) : value;
};
const LocaleString = ({ id, args = [] }) => {
    const locale = useLocale();
    return /* @__PURE__ */ jsx(Fragment, {
        children: localeString(id, locale, args),
    });
};
const OfficeLinkChevron = (props) =>
    /* @__PURE__ */ jsx('svg', {
        width: '24',
        height: '24',
        viewBox: '0 0 24 24',
        fill: 'currentColor',
        ...props,
        children: /* @__PURE__ */ jsx('path', {
            fillRule: 'evenodd',
            clipRule: 'evenodd',
            d: 'M17.4142 12L9.70708 19.7071L8.29286 18.2929L14.5858 12L8.29286 5.70711L9.70708 4.29289L17.4142 12Z',
        }),
    });
const link = '_link_pxvs7_1';
const chevron = '_chevron_pxvs7_18';
const style$4 = {
    link,
    chevron,
};
const OfficeLink = ({ officeInfo }) => {
    const { url, name } = officeInfo;
    return /* @__PURE__ */ jsxs(Link, {
        href: url,
        className: style$4.link,
        children: [
            /* @__PURE__ */ jsx(OfficeLinkChevron, {
                className: style$4.chevron,
                'aria-hidden': true,
            }),
            /* @__PURE__ */ jsx(BodyShort, { children: name }),
        ],
    });
};
var PostnrKategori = /* @__PURE__ */ ((PostnrKategori2) => {
    PostnrKategori2['GateadresserOgPostbokser'] = 'B';
    PostnrKategori2['Felles'] = 'F';
    PostnrKategori2['Gateadresser'] = 'G';
    PostnrKategori2['Postbokser'] = 'P';
    PostnrKategori2['Servicepostnummer'] = 'S';
    return PostnrKategori2;
})(PostnrKategori || {});
const header$1 = '_header_142he_1';
const style$3 = {
    header: header$1,
};
const HeaderText = (result) => {
    const {
        postnr,
        poststed,
        kommuneNavn,
        kategori,
        officeInfo,
        adresseQuery = '',
        withAllBydeler,
    } = result;
    const postnrOgPoststed = `${postnr} ${poststed}`;
    const numHits = officeInfo.length;
    if (numHits === 0) {
        return /* @__PURE__ */ jsx(LocaleString, {
            id: 'postnrResultNone',
            args: [postnrOgPoststed, adresseQuery],
        });
    }
    if (numHits > 1) {
        if (kategori === PostnrKategori.Postbokser) {
            return /* @__PURE__ */ jsx(LocaleString, {
                id: 'postnrResultPostbox',
                args: [postnr, kommuneNavn, numHits.toString()],
            });
        }
        if (kategori === PostnrKategori.Servicepostnummer) {
            return /* @__PURE__ */ jsx(LocaleString, {
                id: 'postnrResultServiceBox',
                args: [postnr, kommuneNavn, numHits.toString()],
            });
        }
        if (withAllBydeler) {
            return /* @__PURE__ */ jsx(LocaleString, {
                id: 'postnrResultBydeler',
                args: [postnr, kommuneNavn, numHits.toString()],
            });
        }
        return /* @__PURE__ */ jsx(LocaleString, {
            id: 'postnrResultMany',
            args: [numHits.toString(), postnrOgPoststed, postnr],
        });
    }
    return /* @__PURE__ */ jsx(LocaleString, {
        id: 'postnrResultOne',
        args: [postnrOgPoststed],
    });
};
const SearchResultPostnr = ({ result }) => {
    const { officeInfo, adresseQuery } = result;
    if (!officeInfo) {
        return /* @__PURE__ */ jsx('div', {
            children: /* @__PURE__ */ jsx(LocaleString, {
                id: 'errorInvalidResult',
            }),
        });
    }
    return /* @__PURE__ */ jsxs('div', {
        children: [
            /* @__PURE__ */ jsx(BodyLong, {
                className: style$3.header,
                children: /* @__PURE__ */ jsx(HeaderText, { ...result }),
            }),
            officeInfo.map((hit) =>
                /* @__PURE__ */ jsxs(
                    Fragment$1,
                    {
                        children: [
                            adresseQuery &&
                                /* @__PURE__ */ jsx(BodyShort, {
                                    size: 'small',
                                    children: `${hit.hitString}:`,
                                }),
                            /* @__PURE__ */ jsx(OfficeLink, {
                                officeInfo: hit,
                            }),
                        ],
                    },
                    hit.enhetNr
                )
            ),
        ],
    });
};
const charMap = {
    đ: 'd',
    ŋ: 'n',
    š: 's',
    ŧ: 't',
    û: 'u',
    ù: 'u',
    ú: 'u',
    ü: 'u',
    ö: 'ø',
    á: 'a',
    à: 'a',
    â: 'a',
    ã: 'a',
    ä: 'a',
    '.': '-',
};
const charsToReplace = Object.keys(charMap).reduce((acc, char) => {
    return acc + char;
}, '');
const replaceSpecialCharPattern = new RegExp(`[${charsToReplace}]`, 'g');
const replaceSpecialCharFunc = (match2) => {
    const newChar = charMap[match2];
    return newChar !== void 0 ? newChar : match2;
};
const normalizeString = (str) =>
    str
        ? str
              .toLowerCase()
              .replace(replaceSpecialCharPattern, replaceSpecialCharFunc)
        : '';
const header = '_header_btl41_1';
const hitname = '_hitname_btl41_5';
const style$2 = {
    header,
    hitname,
};
const NameWithHighlightedInput = ({ name, normalizedInput }) => {
    const normalizedName = normalizeString(name);
    const startIndex = normalizedName.indexOf(normalizedInput);
    if (startIndex === -1) {
        return /* @__PURE__ */ jsx(Fragment, { children: name });
    }
    const preMatch = name.slice(0, startIndex);
    const inputMatch = name.slice(
        startIndex,
        startIndex + normalizedInput.length
    );
    const postMatch = name.slice(startIndex + normalizedInput.length);
    return /* @__PURE__ */ jsxs(Fragment, {
        children: [
            preMatch,
            /* @__PURE__ */ jsx('strong', { children: inputMatch }),
            postMatch,
        ],
    });
};
const SearchResultName = ({ result }) => {
    const { input, hits } = result;
    if (!hits) {
        return /* @__PURE__ */ jsx('div', {
            children: /* @__PURE__ */ jsx(LocaleString, {
                id: 'errorInvalidResult',
            }),
        });
    }
    const normalizedInput = normalizeString(input);
    const numHits = hits.length;
    return /* @__PURE__ */ jsxs('div', {
        children: [
            /* @__PURE__ */ jsx('div', {
                className: style$2.header,
                children:
                    numHits === 0
                        ? /* @__PURE__ */ jsx(LocaleString, {
                              id: 'nameResultNone',
                              args: [input],
                          })
                        : /* @__PURE__ */ jsx(LocaleString, {
                              id: 'nameResultFound',
                              args: [input, numHits.toString()],
                          }),
            }),
            hits.map((nameHit) =>
                /* @__PURE__ */ jsxs(
                    Fragment$1,
                    {
                        children: [
                            /* @__PURE__ */ jsx(BodyShort, {
                                size: 'medium',
                                className: style$2.hitname,
                                children: /* @__PURE__ */ jsx(
                                    NameWithHighlightedInput,
                                    {
                                        name: nameHit.name.toUpperCase(),
                                        normalizedInput,
                                    }
                                ),
                            }),
                            nameHit.officeHits.map((office) =>
                                /* @__PURE__ */ jsx(
                                    OfficeLink,
                                    { officeInfo: office },
                                    office.enhetNr
                                )
                            ),
                        ],
                    },
                    nameHit.name
                )
            ),
        ],
    });
};
const SearchResult = ({ searchResult: searchResult2 }) => {
    if (searchResult2.type === 'postnr') {
        return /* @__PURE__ */ jsx(SearchResultPostnr, {
            result: searchResult2,
        });
    }
    if (searchResult2.type === 'name') {
        return /* @__PURE__ */ jsx(SearchResultName, { result: searchResult2 });
    }
    return null;
};
const clientUrls = {
    appPath: {
        nb: void 0,
        nn: `${void 0}/nn`,
        en: `${void 0}/en`,
    },
    searchApi: `${void 0}${void 0}/api/search`,
    kontaktOss: `${void 0}/person/kontakt-oss`,
};
let abortController =
    typeof window !== 'undefined' ? new AbortController() : null;
const abortSearchClient = () => abortController?.abort();
const fetchSearchClient = (query) => {
    abortSearchClient();
    abortController = new AbortController();
    return fetch(`${clientUrls.searchApi}?query=${query}`, {
        signal: abortController.signal,
        headers: { 'Nav-Office-Search-Client': '1' },
    })
        .then((res) => res.json())
        .catch((e) => {
            if (e.name === 'AbortError') {
                return { type: 'error', aborted: true };
            }
            return { type: 'error', messageId: 'errorServerError' };
        });
};
const postnrQueryRegex = /^\d{4}$/;
const isValidPostnrQuery = (query) => {
    if (!query) {
        return false;
    }
    const postnr = query.split(' ')[0];
    return postnr && postnrQueryRegex.test(postnr);
};
const nameQueryRegex = new RegExp('^(\\p{Letter}|\\.|-| ){2,}$', 'u');
const isValidNameQuery = (query) => {
    return query && nameQueryRegex.test(query);
};
const searchForm = '_searchForm_44ho5_1';
const searchField = '_searchField_44ho5_8';
const searchResult = '_searchResult_44ho5_19';
const error = '_error_44ho5_27';
const style$1 = {
    searchForm,
    searchField,
    searchResult,
    error,
};
const isEmptyInput = (input) => typeof input === 'string' && input.length === 0;
const isValidInput = (input) => typeof input === 'string' && input.length >= 2;
const SearchForm = () => {
    const [searchResult2, setSearchResult] = useState();
    const [error2, setError] = useState();
    const inputRef = useRef(null);
    const setClientError = (id) => {
        setError({ id, type: 'clientError' });
    };
    const setServerError = (id) => {
        setError({ id, type: 'serverError' });
    };
    const resetError = () => {
        setError(null);
    };
    const handleInput = (submit) => {
        const input = inputRef.current?.value;
        abortSearchClient();
        if (runSearch.cancel) {
            runSearch.cancel();
        }
        if (isEmptyInput(input)) {
            setSearchResult(void 0);
        }
        if (!isValidInput(input)) {
            if (submit) {
                setClientError('errorInputValidationLength');
            } else {
                resetError();
            }
            return;
        }
        if (isValidPostnrQuery(input)) {
            runSearch(input);
            return;
        } else if (!isNaN(Number(input))) {
            if (submit) {
                setClientError('errorInputValidationPostnr');
            } else {
                resetError();
            }
            return;
        }
        if (!isValidNameQuery(input)) {
            setClientError('errorInputValidationName');
            return;
        }
        runSearch(input);
    };
    const runSearch = debounce((input) => {
        resetError();
        fetchSearchClient(input).then((result) => {
            if (result.type === 'error') {
                if (result.aborted) {
                    return;
                }
                setSearchResult(void 0);
                setServerError(result.messageId || 'errorServerError');
            } else {
                setSearchResult(result);
            }
        });
    }, 500);
    const handleSubmit = (e) => {
        e.preventDefault();
        handleInput(true);
    };
    return /* @__PURE__ */ jsxs('div', {
        className: style$1.searchForm,
        children: [
            /* @__PURE__ */ jsx('form', {
                onSubmit: handleSubmit,
                className: style$1.searchField,
                children: /* @__PURE__ */ jsx(Search, {
                    variant: 'primary',
                    hideLabel: false,
                    label: /* @__PURE__ */ jsx(LocaleString, {
                        id: 'inputLabel',
                    }),
                    id: 'search-input',
                    autoComplete: 'off',
                    ref: inputRef,
                    onChange: () => handleInput(false),
                    error:
                        error2?.type === 'clientError' &&
                        /* @__PURE__ */ jsx(LocaleString, { id: error2.id }),
                }),
            }),
            error2?.type === 'serverError' &&
                /* @__PURE__ */ jsx('div', {
                    className: style$1.error,
                    children: /* @__PURE__ */ jsx(LocaleString, {
                        id: error2.id,
                    }),
                }),
            searchResult2 &&
                /* @__PURE__ */ jsx('div', {
                    className: style$1.searchResult,
                    children: /* @__PURE__ */ jsx(SearchResult, {
                        searchResult: searchResult2,
                    }),
                }),
        ],
    });
};
const appContainer = '_appContainer_17nha_1';
const title = '_title_17nha_16';
const ingress = '_ingress_17nha_22';
const style = {
    appContainer,
    title,
    ingress,
};
const OfficeSearch = () => {
    return /* @__PURE__ */ jsxs('div', {
        className: style.appContainer,
        children: [
            /* @__PURE__ */ jsx(Heading, {
                size: 'xlarge',
                className: style.title,
                children: /* @__PURE__ */ jsx(LocaleString, {
                    id: 'pageTitle',
                }),
            }),
            /* @__PURE__ */ jsxs(BodyLong, {
                className: style.ingress,
                children: [
                    /* @__PURE__ */ jsx(LocaleString, { id: 'ingressLine1' }),
                    /* @__PURE__ */ jsx('br', {}),
                    /* @__PURE__ */ jsx(LocaleString, { id: 'ingressLine2' }),
                ],
            }),
            /* @__PURE__ */ jsx(SearchForm, {}),
        ],
    });
};
const getDecoratorParams = (locale, kontaktOssUrl) => ({
    context: 'privatperson',
    language: locale,
    breadcrumbs: [
        {
            url: `${kontaktOssUrl}/${locale}`,
            title: localeString('breadcrumb1', locale),
        },
        {
            url: '/',
            title: localeString('breadcrumb2', locale),
        },
    ],
    availableLanguages: [
        { locale: 'nb', handleInApp: true },
        { locale: 'nn', handleInApp: true },
        { locale: 'en', handleInApp: true },
    ],
});
const App = ({ locale = 'nb' }) => {
    const [currentLocale, setCurrentLocale] = useState(locale);
    useEffect(() => {
        const updateLanguageState = (newLocale) => {
            setCurrentLocale(newLocale);
            window.history.replaceState(
                window.history.state,
                '',
                clientUrls.appPath[newLocale]
            );
            document.documentElement.lang = newLocale;
            document.title = localeString('documentTitle', newLocale);
            setParams(getDecoratorParams(newLocale, clientUrls.kontaktOss));
        };
        onLanguageSelect((language) => {
            updateLanguageState(language.locale);
        });
    }, []);
    return /* @__PURE__ */ jsx(LocaleProvider, {
        value: currentLocale,
        children: /* @__PURE__ */ jsx(OfficeSearch, {}),
    });
};
const render = (locale) => {
    return renderToString(/* @__PURE__ */ jsx(App, { locale }));
};
export { render };
