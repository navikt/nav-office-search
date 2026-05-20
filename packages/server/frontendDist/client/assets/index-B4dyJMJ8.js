(function () {
    const t = document.createElement('link').relList;
    if (t && t.supports && t.supports('modulepreload')) return;
    for (const o of document.querySelectorAll('link[rel="modulepreload"]'))
        r(o);
    new MutationObserver((o) => {
        for (const a of o)
            if (a.type === 'childList')
                for (const i of a.addedNodes)
                    i.tagName === 'LINK' && i.rel === 'modulepreload' && r(i);
    }).observe(document, { childList: !0, subtree: !0 });
    function n(o) {
        const a = {};
        return (
            o.integrity && (a.integrity = o.integrity),
            o.referrerPolicy && (a.referrerPolicy = o.referrerPolicy),
            o.crossOrigin === 'use-credentials'
                ? (a.credentials = 'include')
                : o.crossOrigin === 'anonymous'
                  ? (a.credentials = 'omit')
                  : (a.credentials = 'same-origin'),
            a
        );
    }
    function r(o) {
        if (o.ep) return;
        o.ep = !0;
        const a = n(o);
        fetch(o.href, a);
    }
})();
var Pe,
    k,
    tn,
    ie,
    wt,
    nn,
    rn,
    on,
    st,
    Ze,
    Je,
    an,
    Ce = {},
    ln = [],
    Yn = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,
    Ne = Array.isArray;
function G(e, t) {
    for (var n in t) e[n] = t[n];
    return e;
}
function ct(e) {
    e && e.parentNode && e.parentNode.removeChild(e);
}
function te(e, t, n) {
    var r,
        o,
        a,
        i = {};
    for (a in t)
        a == 'key' ? (r = t[a]) : a == 'ref' ? (o = t[a]) : (i[a] = t[a]);
    if (
        (arguments.length > 2 &&
            (i.children = arguments.length > 3 ? Pe.call(arguments, 2) : n),
        typeof e == 'function' && e.defaultProps != null)
    )
        for (a in e.defaultProps) i[a] === void 0 && (i[a] = e.defaultProps[a]);
    return Se(e, i, r, o, null);
}
function Se(e, t, n, r, o) {
    var a = {
        type: e,
        props: t,
        key: n,
        ref: r,
        __k: null,
        __: null,
        __b: 0,
        __e: null,
        __c: null,
        constructor: void 0,
        __v: o ?? ++tn,
        __i: -1,
        __u: 0,
    };
    return (o == null && k.vnode != null && k.vnode(a), a);
}
function er() {
    return { current: null };
}
function C(e) {
    return e.children;
}
function X(e, t) {
    ((this.props = e), (this.context = t));
}
function ue(e, t) {
    if (t == null) return e.__ ? ue(e.__, e.__i + 1) : null;
    for (var n; t < e.__k.length; t++)
        if ((n = e.__k[t]) != null && n.__e != null) return n.__e;
    return typeof e.type == 'function' ? ue(e) : null;
}
function sn(e) {
    var t, n;
    if ((e = e.__) != null && e.__c != null) {
        for (e.__e = e.__c.base = null, t = 0; t < e.__k.length; t++)
            if ((n = e.__k[t]) != null && n.__e != null) {
                e.__e = e.__c.base = n.__e;
                break;
            }
        return sn(e);
    }
}
function Ye(e) {
    ((!e.__d && (e.__d = !0) && ie.push(e) && !De.__r++) ||
        wt != k.debounceRendering) &&
        ((wt = k.debounceRendering) || nn)(De);
}
function De() {
    for (var e, t, n, r, o, a, i, l = 1; ie.length; )
        (ie.length > l && ie.sort(rn),
            (e = ie.shift()),
            (l = ie.length),
            e.__d &&
                ((n = void 0),
                (r = void 0),
                (o = (r = (t = e).__v).__e),
                (a = []),
                (i = []),
                t.__P &&
                    (((n = G({}, r)).__v = r.__v + 1),
                    k.vnode && k.vnode(n),
                    ut(
                        t.__P,
                        n,
                        r,
                        t.__n,
                        t.__P.namespaceURI,
                        32 & r.__u ? [o] : null,
                        a,
                        o ?? ue(r),
                        !!(32 & r.__u),
                        i
                    ),
                    (n.__v = r.__v),
                    (n.__.__k[n.__i] = n),
                    dn(a, n, i),
                    (r.__e = r.__ = null),
                    n.__e != o && sn(n))));
    De.__r = 0;
}
function cn(e, t, n, r, o, a, i, l, u, c, d) {
    var s,
        f,
        m,
        g,
        E,
        S,
        b,
        O = (r && r.__k) || ln,
        D = t.length;
    for (u = tr(n, t, O, u, D), s = 0; s < D; s++)
        (m = n.__k[s]) != null &&
            ((f = m.__i == -1 ? Ce : O[m.__i] || Ce),
            (m.__i = s),
            (S = ut(e, m, f, o, a, i, l, u, c, d)),
            (g = m.__e),
            m.ref &&
                f.ref != m.ref &&
                (f.ref && dt(f.ref, null, m), d.push(m.ref, m.__c || g, m)),
            E == null && g != null && (E = g),
            (b = !!(4 & m.__u)) || f.__k === m.__k
                ? (u = un(m, u, e, b))
                : typeof m.type == 'function' && S !== void 0
                  ? (u = S)
                  : g && (u = g.nextSibling),
            (m.__u &= -7));
    return ((n.__e = E), u);
}
function tr(e, t, n, r, o) {
    var a,
        i,
        l,
        u,
        c,
        d = n.length,
        s = d,
        f = 0;
    for (e.__k = new Array(o), a = 0; a < o; a++)
        (i = t[a]) != null && typeof i != 'boolean' && typeof i != 'function'
            ? (typeof i == 'string' ||
              typeof i == 'number' ||
              typeof i == 'bigint' ||
              i.constructor == String
                  ? (i = e.__k[a] = Se(null, i, null, null, null))
                  : Ne(i)
                    ? (i = e.__k[a] = Se(C, { children: i }, null, null, null))
                    : i.constructor === void 0 && i.__b > 0
                      ? (i = e.__k[a] =
                            Se(
                                i.type,
                                i.props,
                                i.key,
                                i.ref ? i.ref : null,
                                i.__v
                            ))
                      : (e.__k[a] = i),
              (u = a + f),
              (i.__ = e),
              (i.__b = e.__b + 1),
              (l = null),
              (c = i.__i = nr(i, n, u, s)) != -1 &&
                  (s--, (l = n[c]) && (l.__u |= 2)),
              l == null || l.__v == null
                  ? (c == -1 && (o > d ? f-- : o < d && f++),
                    typeof i.type != 'function' && (i.__u |= 4))
                  : c != u &&
                    (c == u - 1
                        ? f--
                        : c == u + 1
                          ? f++
                          : (c > u ? f-- : f++, (i.__u |= 4))))
            : (e.__k[a] = null);
    if (s)
        for (a = 0; a < d; a++)
            (l = n[a]) != null &&
                (2 & l.__u) == 0 &&
                (l.__e == r && (r = ue(l)), _n(l, l));
    return r;
}
function un(e, t, n, r) {
    var o, a;
    if (typeof e.type == 'function') {
        for (o = e.__k, a = 0; o && a < o.length; a++)
            o[a] && ((o[a].__ = e), (t = un(o[a], t, n, r)));
        return t;
    }
    e.__e != t &&
        (r &&
            (t && e.type && !t.parentNode && (t = ue(e)),
            n.insertBefore(e.__e, t || null)),
        (t = e.__e));
    do t = t && t.nextSibling;
    while (t != null && t.nodeType == 8);
    return t;
}
function ee(e, t) {
    return (
        (t = t || []),
        e == null ||
            typeof e == 'boolean' ||
            (Ne(e)
                ? e.some(function (n) {
                      ee(n, t);
                  })
                : t.push(e)),
        t
    );
}
function nr(e, t, n, r) {
    var o,
        a,
        i,
        l = e.key,
        u = e.type,
        c = t[n],
        d = c != null && (2 & c.__u) == 0;
    if ((c === null && l == null) || (d && l == c.key && u == c.type)) return n;
    if (r > (d ? 1 : 0)) {
        for (o = n - 1, a = n + 1; o >= 0 || a < t.length; )
            if (
                (c = t[(i = o >= 0 ? o-- : a++)]) != null &&
                (2 & c.__u) == 0 &&
                l == c.key &&
                u == c.type
            )
                return i;
    }
    return -1;
}
function Ot(e, t, n) {
    t[0] == '-'
        ? e.setProperty(t, n ?? '')
        : (e[t] =
              n == null
                  ? ''
                  : typeof n != 'number' || Yn.test(t)
                    ? n
                    : n + 'px');
}
function je(e, t, n, r, o) {
    var a, i;
    e: if (t == 'style')
        if (typeof n == 'string') e.style.cssText = n;
        else {
            if ((typeof r == 'string' && (e.style.cssText = r = ''), r))
                for (t in r) (n && t in n) || Ot(e.style, t, '');
            if (n) for (t in n) (r && n[t] == r[t]) || Ot(e.style, t, n[t]);
        }
    else if (t[0] == 'o' && t[1] == 'n')
        ((a = t != (t = t.replace(on, '$1'))),
            (i = t.toLowerCase()),
            (t =
                i in e || t == 'onFocusOut' || t == 'onFocusIn'
                    ? i.slice(2)
                    : t.slice(2)),
            e.l || (e.l = {}),
            (e.l[t + a] = n),
            n
                ? r
                    ? (n.u = r.u)
                    : ((n.u = st), e.addEventListener(t, a ? Je : Ze, a))
                : e.removeEventListener(t, a ? Je : Ze, a));
    else {
        if (o == 'http://www.w3.org/2000/svg')
            t = t.replace(/xlink(H|:h)/, 'h').replace(/sName$/, 's');
        else if (
            t != 'width' &&
            t != 'height' &&
            t != 'href' &&
            t != 'list' &&
            t != 'form' &&
            t != 'tabIndex' &&
            t != 'download' &&
            t != 'rowSpan' &&
            t != 'colSpan' &&
            t != 'role' &&
            t != 'popover' &&
            t in e
        )
            try {
                e[t] = n ?? '';
                break e;
            } catch {}
        typeof n == 'function' ||
            (n == null || (n === !1 && t[4] != '-')
                ? e.removeAttribute(t)
                : e.setAttribute(t, t == 'popover' && n == 1 ? '' : n));
    }
}
function St(e) {
    return function (t) {
        if (this.l) {
            var n = this.l[t.type + e];
            if (t.t == null) t.t = st++;
            else if (t.t < n.u) return;
            return n(k.event ? k.event(t) : t);
        }
    };
}
function ut(e, t, n, r, o, a, i, l, u, c) {
    var d,
        s,
        f,
        m,
        g,
        E,
        S,
        b,
        O,
        D,
        F,
        y,
        P,
        U,
        j,
        A,
        K,
        x = t.type;
    if (t.constructor !== void 0) return null;
    (128 & n.__u && ((u = !!(32 & n.__u)), (a = [(l = t.__e = n.__e)])),
        (d = k.__b) && d(t));
    e: if (typeof x == 'function')
        try {
            if (
                ((b = t.props),
                (O = 'prototype' in x && x.prototype.render),
                (D = (d = x.contextType) && r[d.__c]),
                (F = d ? (D ? D.props.value : d.__) : r),
                n.__c
                    ? (S = (s = t.__c = n.__c).__ = s.__E)
                    : (O
                          ? (t.__c = s = new x(b, F))
                          : ((t.__c = s = new X(b, F)),
                            (s.constructor = x),
                            (s.render = or)),
                      D && D.sub(s),
                      s.state || (s.state = {}),
                      (s.__n = r),
                      (f = s.__d = !0),
                      (s.__h = []),
                      (s._sb = [])),
                O && s.__s == null && (s.__s = s.state),
                O &&
                    x.getDerivedStateFromProps != null &&
                    (s.__s == s.state && (s.__s = G({}, s.__s)),
                    G(s.__s, x.getDerivedStateFromProps(b, s.__s))),
                (m = s.props),
                (g = s.state),
                (s.__v = t),
                f)
            )
                (O &&
                    x.getDerivedStateFromProps == null &&
                    s.componentWillMount != null &&
                    s.componentWillMount(),
                    O &&
                        s.componentDidMount != null &&
                        s.__h.push(s.componentDidMount));
            else {
                if (
                    (O &&
                        x.getDerivedStateFromProps == null &&
                        b !== m &&
                        s.componentWillReceiveProps != null &&
                        s.componentWillReceiveProps(b, F),
                    t.__v == n.__v ||
                        (!s.__e &&
                            s.shouldComponentUpdate != null &&
                            s.shouldComponentUpdate(b, s.__s, F) === !1))
                ) {
                    for (
                        t.__v != n.__v &&
                            ((s.props = b), (s.state = s.__s), (s.__d = !1)),
                            t.__e = n.__e,
                            t.__k = n.__k,
                            t.__k.some(function (R) {
                                R && (R.__ = t);
                            }),
                            y = 0;
                        y < s._sb.length;
                        y++
                    )
                        s.__h.push(s._sb[y]);
                    ((s._sb = []), s.__h.length && i.push(s));
                    break e;
                }
                (s.componentWillUpdate != null &&
                    s.componentWillUpdate(b, s.__s, F),
                    O &&
                        s.componentDidUpdate != null &&
                        s.__h.push(function () {
                            s.componentDidUpdate(m, g, E);
                        }));
            }
            if (
                ((s.context = F),
                (s.props = b),
                (s.__P = e),
                (s.__e = !1),
                (P = k.__r),
                (U = 0),
                O)
            ) {
                for (
                    s.state = s.__s,
                        s.__d = !1,
                        P && P(t),
                        d = s.render(s.props, s.state, s.context),
                        j = 0;
                    j < s._sb.length;
                    j++
                )
                    s.__h.push(s._sb[j]);
                s._sb = [];
            } else
                do
                    ((s.__d = !1),
                        P && P(t),
                        (d = s.render(s.props, s.state, s.context)),
                        (s.state = s.__s));
                while (s.__d && ++U < 25);
            ((s.state = s.__s),
                s.getChildContext != null &&
                    (r = G(G({}, r), s.getChildContext())),
                O &&
                    !f &&
                    s.getSnapshotBeforeUpdate != null &&
                    (E = s.getSnapshotBeforeUpdate(m, g)),
                (A = d),
                d != null &&
                    d.type === C &&
                    d.key == null &&
                    (A = fn(d.props.children)),
                (l = cn(e, Ne(A) ? A : [A], t, n, r, o, a, i, l, u, c)),
                (s.base = t.__e),
                (t.__u &= -161),
                s.__h.length && i.push(s),
                S && (s.__E = s.__ = null));
        } catch (R) {
            if (((t.__v = null), u || a != null))
                if (R.then) {
                    for (
                        t.__u |= u ? 160 : 128;
                        l && l.nodeType == 8 && l.nextSibling;
                    )
                        l = l.nextSibling;
                    ((a[a.indexOf(l)] = null), (t.__e = l));
                } else {
                    for (K = a.length; K--; ) ct(a[K]);
                    et(t);
                }
            else ((t.__e = n.__e), (t.__k = n.__k), R.then || et(t));
            k.__e(R, t, n);
        }
    else
        a == null && t.__v == n.__v
            ? ((t.__k = n.__k), (t.__e = n.__e))
            : (l = t.__e = rr(n.__e, t, n, r, o, a, i, u, c));
    return ((d = k.diffed) && d(t), 128 & t.__u ? void 0 : l);
}
function et(e) {
    (e && e.__c && (e.__c.__e = !0), e && e.__k && e.__k.forEach(et));
}
function dn(e, t, n) {
    for (var r = 0; r < n.length; r++) dt(n[r], n[++r], n[++r]);
    (k.__c && k.__c(t, e),
        e.some(function (o) {
            try {
                ((e = o.__h),
                    (o.__h = []),
                    e.some(function (a) {
                        a.call(o);
                    }));
            } catch (a) {
                k.__e(a, o.__v);
            }
        }));
}
function fn(e) {
    return typeof e != 'object' || e == null || (e.__b && e.__b > 0)
        ? e
        : Ne(e)
          ? e.map(fn)
          : G({}, e);
}
function rr(e, t, n, r, o, a, i, l, u) {
    var c,
        d,
        s,
        f,
        m,
        g,
        E,
        S = n.props || Ce,
        b = t.props,
        O = t.type;
    if (
        (O == 'svg'
            ? (o = 'http://www.w3.org/2000/svg')
            : O == 'math'
              ? (o = 'http://www.w3.org/1998/Math/MathML')
              : o || (o = 'http://www.w3.org/1999/xhtml'),
        a != null)
    ) {
        for (c = 0; c < a.length; c++)
            if (
                (m = a[c]) &&
                'setAttribute' in m == !!O &&
                (O ? m.localName == O : m.nodeType == 3)
            ) {
                ((e = m), (a[c] = null));
                break;
            }
    }
    if (e == null) {
        if (O == null) return document.createTextNode(b);
        ((e = document.createElementNS(o, O, b.is && b)),
            l && (k.__m && k.__m(t, a), (l = !1)),
            (a = null));
    }
    if (O == null) S === b || (l && e.data == b) || (e.data = b);
    else {
        if (((a = a && Pe.call(e.childNodes)), !l && a != null))
            for (S = {}, c = 0; c < e.attributes.length; c++)
                S[(m = e.attributes[c]).name] = m.value;
        for (c in S)
            if (((m = S[c]), c != 'children')) {
                if (c == 'dangerouslySetInnerHTML') s = m;
                else if (!(c in b)) {
                    if (
                        (c == 'value' && 'defaultValue' in b) ||
                        (c == 'checked' && 'defaultChecked' in b)
                    )
                        continue;
                    je(e, c, null, m, o);
                }
            }
        for (c in b)
            ((m = b[c]),
                c == 'children'
                    ? (f = m)
                    : c == 'dangerouslySetInnerHTML'
                      ? (d = m)
                      : c == 'value'
                        ? (g = m)
                        : c == 'checked'
                          ? (E = m)
                          : (l && typeof m != 'function') ||
                            S[c] === m ||
                            je(e, c, m, S[c], o));
        if (d)
            (l ||
                (s && (d.__html == s.__html || d.__html == e.innerHTML)) ||
                (e.innerHTML = d.__html),
                (t.__k = []));
        else if (
            (s && (e.innerHTML = ''),
            cn(
                t.type == 'template' ? e.content : e,
                Ne(f) ? f : [f],
                t,
                n,
                r,
                O == 'foreignObject' ? 'http://www.w3.org/1999/xhtml' : o,
                a,
                i,
                a ? a[0] : n.__k && ue(n, 0),
                l,
                u
            ),
            a != null)
        )
            for (c = a.length; c--; ) ct(a[c]);
        l ||
            ((c = 'value'),
            O == 'progress' && g == null
                ? e.removeAttribute('value')
                : g != null &&
                  (g !== e[c] ||
                      (O == 'progress' && !g) ||
                      (O == 'option' && g != S[c])) &&
                  je(e, c, g, S[c], o),
            (c = 'checked'),
            E != null && E != e[c] && je(e, c, E, S[c], o));
    }
    return e;
}
function dt(e, t, n) {
    try {
        if (typeof e == 'function') {
            var r = typeof e.__u == 'function';
            (r && e.__u(), (r && t == null) || (e.__u = e(t)));
        } else e.current = t;
    } catch (o) {
        k.__e(o, n);
    }
}
function _n(e, t, n) {
    var r, o;
    if (
        (k.unmount && k.unmount(e),
        (r = e.ref) && ((r.current && r.current != e.__e) || dt(r, null, t)),
        (r = e.__c) != null)
    ) {
        if (r.componentWillUnmount)
            try {
                r.componentWillUnmount();
            } catch (a) {
                k.__e(a, t);
            }
        r.base = r.__P = null;
    }
    if ((r = e.__k))
        for (o = 0; o < r.length; o++)
            r[o] && _n(r[o], t, n || typeof e.type != 'function');
    (n || ct(e.__e), (e.__c = e.__ = e.__e = void 0));
}
function or(e, t, n) {
    return this.constructor(e, n);
}
function Ee(e, t, n) {
    var r, o, a, i;
    (t == document && (t = document.documentElement),
        k.__ && k.__(e, t),
        (o = (r = typeof n == 'function') ? null : (n && n.__k) || t.__k),
        (a = []),
        (i = []),
        ut(
            t,
            (e = ((!r && n) || t).__k = te(C, null, [e])),
            o || Ce,
            Ce,
            t.namespaceURI,
            !r && n
                ? [n]
                : o
                  ? null
                  : t.firstChild
                    ? Pe.call(t.childNodes)
                    : null,
            a,
            !r && n ? n : o ? o.__e : t.firstChild,
            r,
            i
        ),
        dn(a, e, i));
}
function pn(e, t) {
    Ee(e, t, pn);
}
function ar(e, t, n) {
    var r,
        o,
        a,
        i,
        l = G({}, e.props);
    for (a in (e.type && e.type.defaultProps && (i = e.type.defaultProps), t))
        a == 'key'
            ? (r = t[a])
            : a == 'ref'
              ? (o = t[a])
              : (l[a] = t[a] === void 0 && i != null ? i[a] : t[a]);
    return (
        arguments.length > 2 &&
            (l.children = arguments.length > 3 ? Pe.call(arguments, 2) : n),
        Se(e.type, l, r || e.key, o || e.ref, null)
    );
}
function fe(e) {
    function t(n) {
        var r, o;
        return (
            this.getChildContext ||
                ((r = new Set()),
                ((o = {})[t.__c] = this),
                (this.getChildContext = function () {
                    return o;
                }),
                (this.componentWillUnmount = function () {
                    r = null;
                }),
                (this.shouldComponentUpdate = function (a) {
                    this.props.value != a.value &&
                        r.forEach(function (i) {
                            ((i.__e = !0), Ye(i));
                        });
                }),
                (this.sub = function (a) {
                    r.add(a);
                    var i = a.componentWillUnmount;
                    a.componentWillUnmount = function () {
                        (r && r.delete(a), i && i.call(a));
                    };
                })),
            n.children
        );
    }
    return (
        (t.__c = '__cC' + an++),
        (t.__ = e),
        (t.Provider =
            t.__l =
            (t.Consumer = function (n, r) {
                return n.children(r);
            }).contextType =
                t),
        t
    );
}
((Pe = ln.slice),
    (k = {
        __e: function (e, t, n, r) {
            for (var o, a, i; (t = t.__); )
                if ((o = t.__c) && !o.__)
                    try {
                        if (
                            ((a = o.constructor) &&
                                a.getDerivedStateFromError != null &&
                                (o.setState(a.getDerivedStateFromError(e)),
                                (i = o.__d)),
                            o.componentDidCatch != null &&
                                (o.componentDidCatch(e, r || {}), (i = o.__d)),
                            i)
                        )
                            return (o.__E = o);
                    } catch (l) {
                        e = l;
                    }
            throw e;
        },
    }),
    (tn = 0),
    (X.prototype.setState = function (e, t) {
        var n;
        ((n =
            this.__s != null && this.__s != this.state
                ? this.__s
                : (this.__s = G({}, this.state))),
            typeof e == 'function' && (e = e(G({}, n), this.props)),
            e && G(n, e),
            e != null && this.__v && (t && this._sb.push(t), Ye(this)));
    }),
    (X.prototype.forceUpdate = function (e) {
        this.__v && ((this.__e = !0), e && this.__h.push(e), Ye(this));
    }),
    (X.prototype.render = C),
    (ie = []),
    (nn =
        typeof Promise == 'function'
            ? Promise.prototype.then.bind(Promise.resolve())
            : setTimeout),
    (rn = function (e, t) {
        return e.__v.__b - t.__v.__b;
    }),
    (De.__r = 0),
    (on = /(PointerCapture)$|Capture$/i),
    (st = 0),
    (Ze = St(!1)),
    (Je = St(!0)),
    (an = 0));
var ir = 0;
function _(e, t, n, r, o, a) {
    t || (t = {});
    var i,
        l,
        u = t;
    if ('ref' in u)
        for (l in ((u = {}), t)) l == 'ref' ? (i = t[l]) : (u[l] = t[l]);
    var c = {
        type: e,
        props: u,
        key: n,
        ref: i,
        __k: null,
        __: null,
        __b: 0,
        __e: null,
        __c: null,
        constructor: void 0,
        __v: --ir,
        __i: -1,
        __u: 0,
        __source: o,
        __self: a,
    };
    if (typeof e == 'function' && (i = e.defaultProps))
        for (l in i) u[l] === void 0 && (u[l] = i[l]);
    return (k.vnode && k.vnode(c), c);
}
var ne,
    N,
    We,
    Ct,
    de = 0,
    mn = [],
    I = k,
    Et = I.__b,
    Pt = I.__r,
    Nt = I.diffed,
    $t = I.__c,
    xt = I.unmount,
    It = I.__;
function _e(e, t) {
    (I.__h && I.__h(N, e, de || t), (de = 0));
    var n = N.__H || (N.__H = { __: [], __h: [] });
    return (e >= n.__.length && n.__.push({}), n.__[e]);
}
function Z(e) {
    return ((de = 1), ft(bn, e));
}
function ft(e, t, n) {
    var r = _e(ne++, 2);
    if (
        ((r.t = e),
        !r.__c &&
            ((r.__ = [
                n ? n(t) : bn(void 0, t),
                function (l) {
                    var u = r.__N ? r.__N[0] : r.__[0],
                        c = r.t(u, l);
                    u !== c && ((r.__N = [c, r.__[1]]), r.__c.setState({}));
                },
            ]),
            (r.__c = N),
            !N.__f))
    ) {
        var o = function (l, u, c) {
            if (!r.__c.__H) return !0;
            var d = r.__c.__H.__.filter(function (f) {
                return !!f.__c;
            });
            if (
                d.every(function (f) {
                    return !f.__N;
                })
            )
                return !a || a.call(this, l, u, c);
            var s = r.__c.props !== l;
            return (
                d.forEach(function (f) {
                    if (f.__N) {
                        var m = f.__[0];
                        ((f.__ = f.__N),
                            (f.__N = void 0),
                            m !== f.__[0] && (s = !0));
                    }
                }),
                (a && a.call(this, l, u, c)) || s
            );
        };
        N.__f = !0;
        var a = N.shouldComponentUpdate,
            i = N.componentWillUpdate;
        ((N.componentWillUpdate = function (l, u, c) {
            if (this.__e) {
                var d = a;
                ((a = void 0), o(l, u, c), (a = d));
            }
            i && i.call(this, l, u, c);
        }),
            (N.shouldComponentUpdate = o));
    }
    return r.__N || r.__;
}
function pe(e, t) {
    var n = _e(ne++, 3);
    !I.__s && _t(n.__H, t) && ((n.__ = e), (n.u = t), N.__H.__h.push(n));
}
function me(e, t) {
    var n = _e(ne++, 4);
    !I.__s && _t(n.__H, t) && ((n.__ = e), (n.u = t), N.__h.push(n));
}
function $e(e) {
    return (
        (de = 5),
        Ue(function () {
            return { current: e };
        }, [])
    );
}
function vn(e, t, n) {
    ((de = 6),
        me(
            function () {
                if (typeof e == 'function') {
                    var r = e(t());
                    return function () {
                        (e(null), r && typeof r == 'function' && r());
                    };
                }
                if (e)
                    return (
                        (e.current = t()),
                        function () {
                            return (e.current = null);
                        }
                    );
            },
            n == null ? n : n.concat(e)
        ));
}
function Ue(e, t) {
    var n = _e(ne++, 7);
    return (_t(n.__H, t) && ((n.__ = e()), (n.__H = t), (n.__h = e)), n.__);
}
function hn(e, t) {
    return (
        (de = 8),
        Ue(function () {
            return e;
        }, t)
    );
}
function le(e) {
    var t = N.context[e.__c],
        n = _e(ne++, 9);
    return (
        (n.c = e),
        t ? (n.__ == null && ((n.__ = !0), t.sub(N)), t.props.value) : e.__
    );
}
function gn(e, t) {
    I.useDebugValue && I.useDebugValue(t ? t(e) : e);
}
function yn() {
    var e = _e(ne++, 11);
    if (!e.__) {
        for (var t = N.__v; t !== null && !t.__m && t.__ !== null; ) t = t.__;
        var n = t.__m || (t.__m = [0, 0]);
        e.__ = 'P' + n[0] + '-' + n[1]++;
    }
    return e.__;
}
function lr() {
    for (var e; (e = mn.shift()); )
        if (e.__P && e.__H)
            try {
                (e.__H.__h.forEach(Te),
                    e.__H.__h.forEach(tt),
                    (e.__H.__h = []));
            } catch (t) {
                ((e.__H.__h = []), I.__e(t, e.__v));
            }
}
((I.__b = function (e) {
    ((N = null), Et && Et(e));
}),
    (I.__ = function (e, t) {
        (e && t.__k && t.__k.__m && (e.__m = t.__k.__m), It && It(e, t));
    }),
    (I.__r = function (e) {
        (Pt && Pt(e), (ne = 0));
        var t = (N = e.__c).__H;
        (t &&
            (We === N
                ? ((t.__h = []),
                  (N.__h = []),
                  t.__.forEach(function (n) {
                      (n.__N && (n.__ = n.__N), (n.u = n.__N = void 0));
                  }))
                : (t.__h.forEach(Te),
                  t.__h.forEach(tt),
                  (t.__h = []),
                  (ne = 0))),
            (We = N));
    }),
    (I.diffed = function (e) {
        Nt && Nt(e);
        var t = e.__c;
        (t &&
            t.__H &&
            (t.__H.__h.length &&
                ((mn.push(t) !== 1 && Ct === I.requestAnimationFrame) ||
                    ((Ct = I.requestAnimationFrame) || sr)(lr)),
            t.__H.__.forEach(function (n) {
                (n.u && (n.__H = n.u), (n.u = void 0));
            })),
            (We = N = null));
    }),
    (I.__c = function (e, t) {
        (t.some(function (n) {
            try {
                (n.__h.forEach(Te),
                    (n.__h = n.__h.filter(function (r) {
                        return !r.__ || tt(r);
                    })));
            } catch (r) {
                (t.some(function (o) {
                    o.__h && (o.__h = []);
                }),
                    (t = []),
                    I.__e(r, n.__v));
            }
        }),
            $t && $t(e, t));
    }),
    (I.unmount = function (e) {
        xt && xt(e);
        var t,
            n = e.__c;
        n &&
            n.__H &&
            (n.__H.__.forEach(function (r) {
                try {
                    Te(r);
                } catch (o) {
                    t = o;
                }
            }),
            (n.__H = void 0),
            t && I.__e(t, n.__v));
    }));
var jt = typeof requestAnimationFrame == 'function';
function sr(e) {
    var t,
        n = function () {
            (clearTimeout(r), jt && cancelAnimationFrame(t), setTimeout(e));
        },
        r = setTimeout(n, 35);
    jt && (t = requestAnimationFrame(n));
}
function Te(e) {
    var t = N,
        n = e.__c;
    (typeof n == 'function' && ((e.__c = void 0), n()), (N = t));
}
function tt(e) {
    var t = N;
    ((e.__c = e.__()), (N = t));
}
function _t(e, t) {
    return (
        !e ||
        e.length !== t.length ||
        t.some(function (n, r) {
            return n !== e[r];
        })
    );
}
function bn(e, t) {
    return typeof t == 'function' ? t(e) : t;
}
function kn(e, t) {
    for (var n in t) e[n] = t[n];
    return e;
}
function nt(e, t) {
    for (var n in e) if (n !== '__source' && !(n in t)) return !0;
    for (var r in t) if (r !== '__source' && e[r] !== t[r]) return !0;
    return !1;
}
function wn(e, t) {
    var n = t(),
        r = Z({ t: { __: n, u: t } }),
        o = r[0].t,
        a = r[1];
    return (
        me(
            function () {
                ((o.__ = n), (o.u = t), Ke(o) && a({ t: o }));
            },
            [e, n, t]
        ),
        pe(
            function () {
                return (
                    Ke(o) && a({ t: o }),
                    e(function () {
                        Ke(o) && a({ t: o });
                    })
                );
            },
            [e]
        ),
        n
    );
}
function Ke(e) {
    var t,
        n,
        r = e.u,
        o = e.__;
    try {
        var a = r();
        return !(
            ((t = o) === (n = a) && (t !== 0 || 1 / t == 1 / n)) ||
            (t != t && n != n)
        );
    } catch {
        return !0;
    }
}
function On(e) {
    e();
}
function Sn(e) {
    return e;
}
function Cn() {
    return [!1, On];
}
var En = me;
function rt(e, t) {
    ((this.props = e), (this.context = t));
}
function cr(e, t) {
    function n(o) {
        var a = this.props.ref,
            i = a == o.ref;
        return (
            !i && a && (a.call ? a(null) : (a.current = null)),
            t ? !t(this.props, o) || !i : nt(this.props, o)
        );
    }
    function r(o) {
        return ((this.shouldComponentUpdate = n), te(e, o));
    }
    return (
        (r.displayName = 'Memo(' + (e.displayName || e.name) + ')'),
        (r.prototype.isReactComponent = !0),
        (r.__f = !0),
        (r.type = e),
        r
    );
}
(((rt.prototype = new X()).isPureReactComponent = !0),
    (rt.prototype.shouldComponentUpdate = function (e, t) {
        return nt(this.props, e) || nt(this.state, t);
    }));
var Rt = k.__b;
k.__b = function (e) {
    (e.type && e.type.__f && e.ref && ((e.props.ref = e.ref), (e.ref = null)),
        Rt && Rt(e));
};
var ur =
    (typeof Symbol < 'u' && Symbol.for && Symbol.for('react.forward_ref')) ||
    3911;
function T(e) {
    function t(n) {
        var r = kn({}, n);
        return (delete r.ref, e(r, n.ref || null));
    }
    return (
        (t.$$typeof = ur),
        (t.render = e),
        (t.prototype.isReactComponent = t.__f = !0),
        (t.displayName = 'ForwardRef(' + (e.displayName || e.name) + ')'),
        t
    );
}
var Mt = function (e, t) {
        return e == null ? null : ee(ee(e).map(t));
    },
    dr = {
        map: Mt,
        forEach: Mt,
        count: function (e) {
            return e ? ee(e).length : 0;
        },
        only: function (e) {
            var t = ee(e);
            if (t.length !== 1) throw 'Children.only';
            return t[0];
        },
        toArray: ee,
    },
    fr = k.__e;
k.__e = function (e, t, n, r) {
    if (e.then) {
        for (var o, a = t; (a = a.__); )
            if ((o = a.__c) && o.__c)
                return (
                    t.__e == null && ((t.__e = n.__e), (t.__k = n.__k)),
                    o.__c(e, t)
                );
    }
    fr(e, t, n, r);
};
var Tt = k.unmount;
function Pn(e, t, n) {
    return (
        e &&
            (e.__c &&
                e.__c.__H &&
                (e.__c.__H.__.forEach(function (r) {
                    typeof r.__c == 'function' && r.__c();
                }),
                (e.__c.__H = null)),
            (e = kn({}, e)).__c != null &&
                (e.__c.__P === n && (e.__c.__P = t),
                (e.__c.__e = !0),
                (e.__c = null)),
            (e.__k =
                e.__k &&
                e.__k.map(function (r) {
                    return Pn(r, t, n);
                }))),
        e
    );
}
function Nn(e, t, n) {
    return (
        e &&
            n &&
            ((e.__v = null),
            (e.__k =
                e.__k &&
                e.__k.map(function (r) {
                    return Nn(r, t, n);
                })),
            e.__c &&
                e.__c.__P === t &&
                (e.__e && n.appendChild(e.__e),
                (e.__c.__e = !0),
                (e.__c.__P = n))),
        e
    );
}
function Ae() {
    ((this.__u = 0), (this.o = null), (this.__b = null));
}
function $n(e) {
    if (!e.__) return null;
    var t = e.__.__c;
    return t && t.__a && t.__a(e);
}
function _r(e) {
    var t,
        n,
        r,
        o = null;
    function a(i) {
        if (
            (t ||
                (t = e()).then(
                    function (l) {
                        (l && (o = l.default || l), (r = !0));
                    },
                    function (l) {
                        ((n = l), (r = !0));
                    }
                ),
            n)
        )
            throw n;
        if (!r) throw t;
        return o ? te(o, i) : null;
    }
    return ((a.displayName = 'Lazy'), (a.__f = !0), a);
}
function we() {
    ((this.i = null), (this.l = null));
}
((k.unmount = function (e) {
    var t = e.__c;
    (t && (t.__z = !0),
        t && t.__R && t.__R(),
        t && 32 & e.__u && (e.type = null),
        Tt && Tt(e));
}),
    ((Ae.prototype = new X()).__c = function (e, t) {
        var n = t.__c,
            r = this;
        (r.o == null && (r.o = []), r.o.push(n));
        var o = $n(r.__v),
            a = !1,
            i = function () {
                a || r.__z || ((a = !0), (n.__R = null), o ? o(u) : u());
            };
        n.__R = i;
        var l = n.__P;
        n.__P = null;
        var u = function () {
            if (!--r.__u) {
                if (r.state.__a) {
                    var c = r.state.__a;
                    r.__v.__k[0] = Nn(c, c.__c.__P, c.__c.__O);
                }
                var d;
                for (r.setState({ __a: (r.__b = null) }); (d = r.o.pop()); )
                    ((d.__P = l), d.forceUpdate());
            }
        };
        (r.__u++ || 32 & t.__u || r.setState({ __a: (r.__b = r.__v.__k[0]) }),
            e.then(i, i));
    }),
    (Ae.prototype.componentWillUnmount = function () {
        this.o = [];
    }),
    (Ae.prototype.render = function (e, t) {
        if (this.__b) {
            if (this.__v.__k) {
                var n = document.createElement('div'),
                    r = this.__v.__k[0].__c;
                this.__v.__k[0] = Pn(this.__b, n, (r.__O = r.__P));
            }
            this.__b = null;
        }
        var o = t.__a && te(C, null, e.fallback);
        return (
            o && (o.__u &= -33),
            [te(C, null, t.__a ? null : e.children), o]
        );
    }));
var At = function (e, t, n) {
    if (
        (++n[1] === n[0] && e.l.delete(t),
        e.props.revealOrder && (e.props.revealOrder[0] !== 't' || !e.l.size))
    )
        for (n = e.i; n; ) {
            for (; n.length > 3; ) n.pop()();
            if (n[1] < n[0]) break;
            e.i = n = n[2];
        }
};
function pr(e) {
    return (
        (this.getChildContext = function () {
            return e.context;
        }),
        e.children
    );
}
function mr(e) {
    var t = this,
        n = e.h;
    if (
        ((t.componentWillUnmount = function () {
            (Ee(null, t.v), (t.v = null), (t.h = null));
        }),
        t.h && t.h !== n && t.componentWillUnmount(),
        !t.v)
    ) {
        for (var r = t.__v; r !== null && !r.__m && r.__ !== null; ) r = r.__;
        ((t.h = n),
            (t.v = {
                nodeType: 1,
                parentNode: n,
                childNodes: [],
                __k: { __m: r.__m },
                contains: function () {
                    return !0;
                },
                namespaceURI: n.namespaceURI,
                insertBefore: function (o, a) {
                    (this.childNodes.push(o), t.h.insertBefore(o, a));
                },
                removeChild: function (o) {
                    (this.childNodes.splice(
                        this.childNodes.indexOf(o) >>> 1,
                        1
                    ),
                        t.h.removeChild(o));
                },
            }));
    }
    Ee(te(pr, { context: t.context }, e.__v), t.v);
}
function vr(e, t) {
    var n = te(mr, { __v: e, h: t });
    return ((n.containerInfo = t), n);
}
(((we.prototype = new X()).__a = function (e) {
    var t = this,
        n = $n(t.__v),
        r = t.l.get(e);
    return (
        r[0]++,
        function (o) {
            var a = function () {
                t.props.revealOrder ? (r.push(o), At(t, e, r)) : o();
            };
            n ? n(a) : a();
        }
    );
}),
    (we.prototype.render = function (e) {
        ((this.i = null), (this.l = new Map()));
        var t = ee(e.children);
        e.revealOrder && e.revealOrder[0] === 'b' && t.reverse();
        for (var n = t.length; n--; )
            this.l.set(t[n], (this.i = [1, 0, this.i]));
        return e.children;
    }),
    (we.prototype.componentDidUpdate = we.prototype.componentDidMount =
        function () {
            var e = this;
            this.l.forEach(function (t, n) {
                At(e, n, t);
            });
        }));
var xn =
        (typeof Symbol < 'u' && Symbol.for && Symbol.for('react.element')) ||
        60103,
    hr =
        /^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/,
    gr = /^on(Ani|Tra|Tou|BeforeInp|Compo)/,
    yr = /[A-Z0-9]/g,
    br = typeof document < 'u',
    kr = function (e) {
        return (
            typeof Symbol < 'u' && typeof Symbol() == 'symbol'
                ? /fil|che|rad/
                : /fil|che|ra/
        ).test(e);
    };
function In(e, t, n) {
    return (
        t.__k == null && (t.textContent = ''),
        Ee(e, t),
        typeof n == 'function' && n(),
        e ? e.__c : null
    );
}
function jn(e, t, n) {
    return (pn(e, t), typeof n == 'function' && n(), e ? e.__c : null);
}
((X.prototype.isReactComponent = {}),
    [
        'componentWillMount',
        'componentWillReceiveProps',
        'componentWillUpdate',
    ].forEach(function (e) {
        Object.defineProperty(X.prototype, e, {
            configurable: !0,
            get: function () {
                return this['UNSAFE_' + e];
            },
            set: function (t) {
                Object.defineProperty(this, e, {
                    configurable: !0,
                    writable: !0,
                    value: t,
                });
            },
        });
    }));
var Lt = k.event;
function wr() {}
function Or() {
    return this.cancelBubble;
}
function Sr() {
    return this.defaultPrevented;
}
k.event = function (e) {
    return (
        Lt && (e = Lt(e)),
        (e.persist = wr),
        (e.isPropagationStopped = Or),
        (e.isDefaultPrevented = Sr),
        (e.nativeEvent = e)
    );
};
var pt,
    Cr = {
        enumerable: !1,
        configurable: !0,
        get: function () {
            return this.class;
        },
    },
    Dt = k.vnode;
k.vnode = function (e) {
    (typeof e.type == 'string' &&
        (function (t) {
            var n = t.props,
                r = t.type,
                o = {},
                a = r.indexOf('-') === -1;
            for (var i in n) {
                var l = n[i];
                if (
                    !(
                        (i === 'value' && 'defaultValue' in n && l == null) ||
                        (br && i === 'children' && r === 'noscript') ||
                        i === 'class' ||
                        i === 'className'
                    )
                ) {
                    var u = i.toLowerCase();
                    (i === 'defaultValue' && 'value' in n && n.value == null
                        ? (i = 'value')
                        : i === 'download' && l === !0
                          ? (l = '')
                          : u === 'translate' && l === 'no'
                            ? (l = !1)
                            : u[0] === 'o' && u[1] === 'n'
                              ? u === 'ondoubleclick'
                                  ? (i = 'ondblclick')
                                  : u !== 'onchange' ||
                                      (r !== 'input' && r !== 'textarea') ||
                                      kr(n.type)
                                    ? u === 'onfocus'
                                        ? (i = 'onfocusin')
                                        : u === 'onblur'
                                          ? (i = 'onfocusout')
                                          : gr.test(i) && (i = u)
                                    : (u = i = 'oninput')
                              : a && hr.test(i)
                                ? (i = i.replace(yr, '-$&').toLowerCase())
                                : l === null && (l = void 0),
                        u === 'oninput' && o[(i = u)] && (i = 'oninputCapture'),
                        (o[i] = l));
                }
            }
            (r == 'select' &&
                o.multiple &&
                Array.isArray(o.value) &&
                (o.value = ee(n.children).forEach(function (c) {
                    c.props.selected = o.value.indexOf(c.props.value) != -1;
                })),
                r == 'select' &&
                    o.defaultValue != null &&
                    (o.value = ee(n.children).forEach(function (c) {
                        c.props.selected = o.multiple
                            ? o.defaultValue.indexOf(c.props.value) != -1
                            : o.defaultValue == c.props.value;
                    })),
                n.class && !n.className
                    ? ((o.class = n.class),
                      Object.defineProperty(o, 'className', Cr))
                    : ((n.className && !n.class) || (n.class && n.className)) &&
                      (o.class = o.className = n.className),
                (t.props = o));
        })(e),
        (e.$$typeof = xn),
        Dt && Dt(e));
};
var Ft = k.__r;
k.__r = function (e) {
    (Ft && Ft(e), (pt = e.__c));
};
var Ut = k.diffed;
k.diffed = function (e) {
    Ut && Ut(e);
    var t = e.props,
        n = e.__e;
    (n != null &&
        e.type === 'textarea' &&
        'value' in t &&
        t.value !== n.value &&
        (n.value = t.value == null ? '' : t.value),
        (pt = null));
};
var Er = {
    ReactCurrentDispatcher: {
        current: {
            readContext: function (e) {
                return pt.__n[e.__c].props.value;
            },
            useCallback: hn,
            useContext: le,
            useDebugValue: gn,
            useDeferredValue: Sn,
            useEffect: pe,
            useId: yn,
            useImperativeHandle: vn,
            useInsertionEffect: En,
            useLayoutEffect: me,
            useMemo: Ue,
            useReducer: ft,
            useRef: $e,
            useState: Z,
            useSyncExternalStore: wn,
            useTransition: Cn,
        },
    },
};
function Pr(e) {
    return te.bind(null, e);
}
function Ve(e) {
    return !!e && e.$$typeof === xn;
}
function Nr(e) {
    return Ve(e) && e.type === C;
}
function $r(e) {
    return (
        !!e &&
        !!e.displayName &&
        (typeof e.displayName == 'string' || e.displayName instanceof String) &&
        e.displayName.startsWith('Memo(')
    );
}
function xr(e) {
    return Ve(e) ? ar.apply(null, arguments) : e;
}
function Rn(e) {
    return !!e.__k && (Ee(null, e), !0);
}
function Ir(e) {
    return (e && (e.base || (e.nodeType === 1 && e))) || null;
}
var jr = function (e, t) {
        return e(t);
    },
    Rr = function (e, t) {
        return e(t);
    },
    Mr = C,
    Tr = Ve,
    v = {
        useState: Z,
        useId: yn,
        useReducer: ft,
        useEffect: pe,
        useLayoutEffect: me,
        useInsertionEffect: En,
        useTransition: Cn,
        useDeferredValue: Sn,
        useSyncExternalStore: wn,
        startTransition: On,
        useRef: $e,
        useImperativeHandle: vn,
        useMemo: Ue,
        useCallback: hn,
        useContext: le,
        useDebugValue: gn,
        version: '18.3.1',
        Children: dr,
        render: In,
        hydrate: jn,
        unmountComponentAtNode: Rn,
        createPortal: vr,
        createElement: te,
        createContext: fe,
        createFactory: Pr,
        cloneElement: xr,
        createRef: er,
        Fragment: C,
        isValidElement: Ve,
        isElement: Tr,
        isFragment: Nr,
        isMemo: $r,
        findDOMNode: Ir,
        Component: X,
        PureComponent: rt,
        memo: cr,
        forwardRef: T,
        flushSync: Rr,
        unstable_batchedUpdates: jr,
        StrictMode: Mr,
        Suspense: Ae,
        SuspenseList: we,
        lazy: _r,
        __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: Er,
    };
function Mn(e) {
    return {
        render: function (t) {
            In(t, e);
        },
        unmount: function () {
            Rn(e);
        },
    };
}
function Ar(e, t) {
    return (jn(t, e), Mn(e));
}
const Lr = { createRoot: Mn, hydrateRoot: Ar };
var Re =
    typeof globalThis < 'u'
        ? globalThis
        : typeof window < 'u'
          ? window
          : typeof global < 'u'
            ? global
            : typeof self < 'u'
              ? self
              : {};
function Dr(e) {
    return e &&
        e.__esModule &&
        Object.prototype.hasOwnProperty.call(e, 'default')
        ? e.default
        : e;
}
var qe, Vt;
function Fr() {
    if (Vt) return qe;
    Vt = 1;
    var e = 'Expected a function',
        t = NaN,
        n = '[object Symbol]',
        r = /^\s+|\s+$/g,
        o = /^[-+]0x[0-9a-f]+$/i,
        a = /^0b[01]+$/i,
        i = /^0o[0-7]+$/i,
        l = parseInt,
        u = typeof Re == 'object' && Re && Re.Object === Object && Re,
        c = typeof self == 'object' && self && self.Object === Object && self,
        d = u || c || Function('return this')(),
        s = Object.prototype,
        f = s.toString,
        m = Math.max,
        g = Math.min,
        E = function () {
            return d.Date.now();
        };
    function S(y, P, U) {
        var j,
            A,
            K,
            x,
            R,
            L,
            Q = 0,
            se = !1,
            J = !1,
            V = !0;
        if (typeof y != 'function') throw new TypeError(e);
        ((P = F(P) || 0),
            b(U) &&
                ((se = !!U.leading),
                (J = 'maxWait' in U),
                (K = J ? m(F(U.maxWait) || 0, P) : K),
                (V = 'trailing' in U ? !!U.trailing : V)));
        function z(M) {
            var q = j,
                oe = A;
            return ((j = A = void 0), (Q = M), (x = y.apply(oe, q)), x);
        }
        function re(M) {
            return ((Q = M), (R = setTimeout(ce, P)), se ? z(M) : x);
        }
        function kt(M) {
            var q = M - L,
                oe = M - Q,
                p = P - q;
            return J ? g(p, K - oe) : p;
        }
        function Ie(M) {
            var q = M - L,
                oe = M - Q;
            return L === void 0 || q >= P || q < 0 || (J && oe >= K);
        }
        function ce() {
            var M = E();
            if (Ie(M)) return he(M);
            R = setTimeout(ce, kt(M));
        }
        function he(M) {
            return ((R = void 0), V && j ? z(M) : ((j = A = void 0), x));
        }
        function ze() {
            (R !== void 0 && clearTimeout(R),
                (Q = 0),
                (j = L = A = R = void 0));
        }
        function Be() {
            return R === void 0 ? x : he(E());
        }
        function ge() {
            var M = E(),
                q = Ie(M);
            if (((j = arguments), (A = this), (L = M), q)) {
                if (R === void 0) return re(L);
                if (J) return ((R = setTimeout(ce, P)), z(L));
            }
            return (R === void 0 && (R = setTimeout(ce, P)), x);
        }
        return ((ge.cancel = ze), (ge.flush = Be), ge);
    }
    function b(y) {
        var P = typeof y;
        return !!y && (P == 'object' || P == 'function');
    }
    function O(y) {
        return !!y && typeof y == 'object';
    }
    function D(y) {
        return typeof y == 'symbol' || (O(y) && f.call(y) == n);
    }
    function F(y) {
        if (typeof y == 'number') return y;
        if (D(y)) return t;
        if (b(y)) {
            var P = typeof y.valueOf == 'function' ? y.valueOf() : y;
            y = b(P) ? P + '' : P;
        }
        if (typeof y != 'string') return y === 0 ? y : +y;
        y = y.replace(r, '');
        var U = a.test(y);
        return U || i.test(y) ? l(y.slice(2), U ? 2 : 8) : o.test(y) ? t : +y;
    }
    return ((qe = S), qe);
}
var Ur = Fr();
const Vr = Dr(Ur);
function Tn(e) {
    var t,
        n,
        r = '';
    if (typeof e == 'string' || typeof e == 'number') r += e;
    else if (typeof e == 'object')
        if (Array.isArray(e)) {
            var o = e.length;
            for (t = 0; t < o; t++)
                e[t] && (n = Tn(e[t])) && (r && (r += ' '), (r += n));
        } else for (n in e) e[n] && (r && (r += ' '), (r += n));
    return r;
}
function xe() {
    for (var e, t, n = 0, r = '', o = arguments.length; n < o; n++)
        (e = arguments[n]) && (t = Tn(e)) && (r && (r += ' '), (r += t));
    return r;
}
const Ht = {};
function An(e, t) {
    const n = $e(Ht);
    return (n.current === Ht && (n.current = e(t)), n);
}
const Qe = v[`useInsertionEffect${Math.random().toFixed(1)}`.slice(0, -3)],
    Hr = Qe && Qe !== me ? Qe : (e) => e();
function zt(e) {
    const t = An(zr).current;
    return ((t.next = e), Hr(t.effect), t.trampoline);
}
function zr() {
    const e = {
        next: void 0,
        callback: Br,
        trampoline: (...t) => {
            var n;
            return (n = e.callback) === null || n === void 0
                ? void 0
                : n.call(e, ...t);
        },
        effect: () => {
            e.callback = e.next;
        },
    };
    return e;
}
function Br() {}
function Wr({ value: e, defaultValue: t, onChange: n }) {
    const r = zt(n),
        [o, a] = Z(t),
        i = e !== void 0,
        l = i ? e : o,
        u = zt((c) => {
            const s = typeof c == 'function' ? c(l) : c;
            (i || a(s), r(s));
        });
    return [l, u];
}
function Ln(e, t, n, r) {
    const o = An(Kr).current;
    return (qr(o, e, t, n, r) && Qr(o, [e, t, n, r]), o.callback);
}
function Kr() {
    return { callback: null, cleanup: null, refs: [] };
}
function qr(e, t, n, r, o) {
    return (
        e.refs[0] !== t || e.refs[1] !== n || e.refs[2] !== r || e.refs[3] !== o
    );
}
function Qr(e, t) {
    if (((e.refs = t), t.every((n) => n == null))) {
        e.callback = null;
        return;
    }
    e.callback = (n) => {
        if ((e.cleanup && (e.cleanup(), (e.cleanup = null)), n != null)) {
            const r = Array(t.length).fill(null);
            for (let o = 0; o < t.length; o += 1) {
                const a = t[o];
                if (a != null)
                    switch (typeof a) {
                        case 'function': {
                            const i = a(n);
                            typeof i == 'function' && (r[o] = i);
                            break;
                        }
                        case 'object': {
                            a.current = n;
                            break;
                        }
                    }
            }
            e.cleanup = () => {
                for (let o = 0; o < t.length; o += 1) {
                    const a = t[o];
                    if (a != null)
                        switch (typeof a) {
                            case 'function': {
                                const i = r[o];
                                typeof i == 'function' ? i() : a(null);
                                break;
                            }
                            case 'object': {
                                a.current = null;
                                break;
                            }
                        }
                }
            };
        }
    };
}
let Bt = 0;
function Gr(e) {
    const [t, n] = Z(e),
        r = e || t;
    return (
        pe(() => {
            t == null && ((Bt += 1), n(`aksel-id-${Bt}`));
        }, [t]),
        r
    );
}
const Wt = v.useId;
function Dn(e) {
    var t;
    return Wt !== void 0
        ? Wt().replace(/(:)/g, '')
        : (t = Gr(e)) !== null && t !== void 0
          ? t
          : '';
}
function Xr(e, t) {
    const n = Object.assign({}, t);
    for (const r in t) {
        const o = e[r],
            a = t[r];
        /^on[A-Z]/.test(r)
            ? o && a
                ? (n[r] = (...l) => {
                      (a(...l), o(...l));
                  })
                : o && (n[r] = o)
            : r === 'style'
              ? (n[r] = Object.assign(Object.assign({}, o), a))
              : r === 'className' && (n[r] = [o, a].filter(Boolean).join(' '));
    }
    return Object.assign(Object.assign({}, e), n);
}
var Zr = function (e, t) {
    var n = {};
    for (var r in e)
        Object.prototype.hasOwnProperty.call(e, r) &&
            t.indexOf(r) < 0 &&
            (n[r] = e[r]);
    if (e != null && typeof Object.getOwnPropertySymbols == 'function')
        for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
            t.indexOf(r[o]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(e, r[o]) &&
                (n[r[o]] = e[r[o]]);
    return n;
};
function Jr(e) {
    return v.isValidElement(e)
        ? Object.prototype.propertyIsEnumerable.call(e.props, 'ref')
            ? e.props.ref
            : e.ref
        : null;
}
const Fn = v.forwardRef((e, t) => {
    var n;
    const { children: r } = e,
        o = Zr(e, ['children']),
        a = Jr(r),
        i = Ln(t, a);
    if (v.isValidElement(r))
        return v.cloneElement(
            r,
            Object.assign(Object.assign({}, Xr(o, r.props)), { ref: i })
        );
    if (v.Children.count(r) > 1) {
        const l = new Error(
            "Aksel: Components using 'asChild' expects to recieve a single React element child."
        );
        throw (
            (l.name = 'SlotError'),
            (n = Error.captureStackTrace) === null ||
                n === void 0 ||
                n.call(Error, l, Fn),
            l
        );
    }
    return null;
});
var Yr = function (e, t) {
    var n = {};
    for (var r in e)
        Object.prototype.hasOwnProperty.call(e, r) &&
            t.indexOf(r) < 0 &&
            (n[r] = e[r]);
    if (e != null && typeof Object.getOwnPropertySymbols == 'function')
        for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
            t.indexOf(r[o]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(e, r[o]) &&
                (n[r[o]] = e[r[o]]);
    return n;
};
function eo(e) {
    return `Aksel: use${e}Context returned \`undefined\`. Seems you forgot to wrap component within ${e}Provider`;
}
function Un(e) {
    const { name: t, defaultValue: n, errorMessage: r } = e,
        o = 'defaultValue' in e,
        a = fe(n);
    a.displayName = t;
    function i(u) {
        var { children: c } = u,
            d = Yr(u, ['children']);
        const s = v.useMemo(() => d, Object.values(d));
        return v.createElement(a.Provider, { value: s }, c);
    }
    i.displayName = `${t}Provider`;
    function l(u = !0) {
        var c;
        const d = le(a);
        if (!o && !d && u) {
            const s = new Error(r ?? eo(t));
            throw (
                (s.name = 'ContextError'),
                (c = Error.captureStackTrace) === null ||
                    c === void 0 ||
                    c.call(Error, s, l),
                s
            );
        }
        return d;
    }
    return { Provider: i, useContext: l };
}
const { Provider: to, useContext: W } = Un({
        name: 'RenameCSS',
        defaultValue: { cn: xe },
    }),
    no = (...e) =>
        xe(e)
            .replace(/^navds-/g, 'aksel-')
            .replace(/\snavds-/g, ' aksel-')
            .trim(),
    ro = ({ children: e }) => v.createElement(to, { cn: no }, e),
    oo = 'accent',
    { Provider: ao, useContext: mt } = Un({
        name: 'ThemeProvider',
        defaultValue: { color: oo, isDarkside: !1 },
    });
T((e, t) => {
    const n = mt(),
        {
            children: r,
            className: o,
            asChild: a = !1,
            theme: i = n?.theme,
            hasBackground: l = !0,
            'data-color': u = n?.color,
        } = e,
        c = !n?.isDarkside,
        d = l ?? (c && e.theme !== void 0),
        s = a ? Fn : 'div';
    return v.createElement(
        ao,
        { theme: i, color: u, isDarkside: !0 },
        v.createElement(
            ro,
            null,
            v.createElement(
                s,
                {
                    ref: t,
                    className: xe('aksel-theme', o, i),
                    'data-background': d,
                    'data-color': u ?? '',
                },
                r
            )
        )
    );
});
const ve = (e) =>
    xe({
        'navds-typo--spacing': e.spacing,
        'navds-typo--truncate': e.truncate,
        'navds-typo--semibold': e.weight === 'semibold',
        [`navds-typo--align-${e.align}`]: e.align,
        [`navds-typo--color-${e.textColor}`]: e.textColor,
        'navds-typo--visually-hidden': e.visuallyHidden,
        'navds-typo--uppercase': e.uppercase,
    });
var io = function (e, t) {
    var n = {};
    for (var r in e)
        Object.prototype.hasOwnProperty.call(e, r) &&
            t.indexOf(r) < 0 &&
            (n[r] = e[r]);
    if (e != null && typeof Object.getOwnPropertySymbols == 'function')
        for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
            t.indexOf(r[o]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(e, r[o]) &&
                (n[r[o]] = e[r[o]]);
    return n;
};
const vt = T((e, t) => {
    var {
            className: n,
            size: r = 'medium',
            as: o = 'p',
            spacing: a,
            truncate: i,
            weight: l = 'regular',
            align: u,
            visuallyHidden: c,
            textColor: d,
        } = e,
        s = io(e, [
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
    const { cn: f } = W();
    return v.createElement(
        o,
        Object.assign({}, s, {
            ref: t,
            className: f(
                n,
                'navds-body-long',
                `navds-body-long--${r}`,
                ve({
                    spacing: a,
                    truncate: i,
                    weight: l,
                    align: u,
                    visuallyHidden: c,
                    textColor: d,
                })
            ),
        })
    );
});
var lo = function (e, t) {
    var n = {};
    for (var r in e)
        Object.prototype.hasOwnProperty.call(e, r) &&
            t.indexOf(r) < 0 &&
            (n[r] = e[r]);
    if (e != null && typeof Object.getOwnPropertySymbols == 'function')
        for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
            t.indexOf(r[o]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(e, r[o]) &&
                (n[r[o]] = e[r[o]]);
    return n;
};
const He = T((e, t) => {
    var {
            className: n,
            size: r = 'medium',
            as: o = 'p',
            spacing: a,
            truncate: i,
            weight: l = 'regular',
            align: u,
            visuallyHidden: c,
            textColor: d,
        } = e,
        s = lo(e, [
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
    const { cn: f } = W();
    return v.createElement(
        o,
        Object.assign({}, s, {
            ref: t,
            className: f(
                n,
                'navds-body-short',
                `navds-body-short--${r}`,
                ve({
                    spacing: a,
                    truncate: i,
                    weight: l,
                    align: u,
                    visuallyHidden: c,
                    textColor: d,
                })
            ),
        })
    );
});
var so = function (e, t) {
    var n = {};
    for (var r in e)
        Object.prototype.hasOwnProperty.call(e, r) &&
            t.indexOf(r) < 0 &&
            (n[r] = e[r]);
    if (e != null && typeof Object.getOwnPropertySymbols == 'function')
        for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
            t.indexOf(r[o]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(e, r[o]) &&
                (n[r[o]] = e[r[o]]);
    return n;
};
T((e, t) => {
    var {
            className: n,
            size: r = 'medium',
            spacing: o,
            uppercase: a,
            as: i = 'p',
            truncate: l,
            weight: u = 'regular',
            align: c,
            visuallyHidden: d,
            textColor: s,
        } = e,
        f = so(e, [
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
    const { cn: m } = W();
    return v.createElement(
        i,
        Object.assign({}, f, {
            ref: t,
            className: m(
                n,
                'navds-detail',
                ve({
                    spacing: o,
                    truncate: l,
                    weight: u,
                    align: c,
                    visuallyHidden: d,
                    textColor: s,
                    uppercase: a,
                }),
                { 'navds-detail--small': r === 'small' }
            ),
        })
    );
});
var co = function (e, t) {
    var n = {};
    for (var r in e)
        Object.prototype.hasOwnProperty.call(e, r) &&
            t.indexOf(r) < 0 &&
            (n[r] = e[r]);
    if (e != null && typeof Object.getOwnPropertySymbols == 'function')
        for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
            t.indexOf(r[o]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(e, r[o]) &&
                (n[r[o]] = e[r[o]]);
    return n;
};
const uo = T((e, t) => {
    var {
            children: n,
            className: r,
            size: o,
            spacing: a,
            as: i = 'p',
            showIcon: l = !1,
        } = e,
        u = co(e, [
            'children',
            'className',
            'size',
            'spacing',
            'as',
            'showIcon',
        ]);
    const { cn: c } = W();
    return v.createElement(
        i,
        Object.assign({}, u, {
            ref: t,
            className: c(
                'navds-error-message',
                'navds-label',
                r,
                ve({ spacing: a }),
                {
                    'navds-label--small': o === 'small',
                    'navds-error-message--show-icon': l,
                }
            ),
        }),
        l &&
            v.createElement(
                'svg',
                {
                    viewBox: '0 0 17 16',
                    fill: 'none',
                    xmlns: 'http://www.w3.org/2000/svg',
                    focusable: !1,
                    'aria-hidden': !0,
                },
                v.createElement('path', {
                    fillRule: 'evenodd',
                    clipRule: 'evenodd',
                    d: 'M3.49209 11.534L8.11398 2.7594C8.48895 2.04752 9.50833 2.04743 9.88343 2.75924L14.5073 11.5339C14.8582 12.1998 14.3753 13 13.6226 13H4.37685C3.6242 13 3.14132 12.1999 3.49209 11.534ZM9.74855 10.495C9.74855 10.9092 9.41276 11.245 8.99855 11.245C8.58433 11.245 8.24855 10.9092 8.24855 10.495C8.24855 10.0808 8.58433 9.74497 8.99855 9.74497C9.41276 9.74497 9.74855 10.0808 9.74855 10.495ZM9.49988 5.49997C9.49988 5.22383 9.27602 4.99997 8.99988 4.99997C8.72373 4.99997 8.49988 5.22383 8.49988 5.49997V7.99997C8.49988 8.27611 8.72373 8.49997 8.99988 8.49997C9.27602 8.49997 9.49988 8.27611 9.49988 7.99997V5.49997Z',
                    fill: 'currentColor',
                })
            ),
        n
    );
});
var fo = function (e, t) {
    var n = {};
    for (var r in e)
        Object.prototype.hasOwnProperty.call(e, r) &&
            t.indexOf(r) < 0 &&
            (n[r] = e[r]);
    if (e != null && typeof Object.getOwnPropertySymbols == 'function')
        for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
            t.indexOf(r[o]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(e, r[o]) &&
                (n[r[o]] = e[r[o]]);
    return n;
};
const _o = T((e, t) => {
    var {
            level: n = '1',
            size: r,
            className: o,
            as: a,
            spacing: i,
            align: l,
            visuallyHidden: u,
            textColor: c,
        } = e,
        d = fo(e, [
            'level',
            'size',
            'className',
            'as',
            'spacing',
            'align',
            'visuallyHidden',
            'textColor',
        ]);
    const { cn: s } = W(),
        f = a ?? `h${n}`;
    return v.createElement(
        f,
        Object.assign({}, d, {
            ref: t,
            className: s(
                o,
                'navds-heading',
                `navds-heading--${r}`,
                ve({ spacing: i, align: l, visuallyHidden: u, textColor: c })
            ),
        })
    );
});
var po = function (e, t) {
    var n = {};
    for (var r in e)
        Object.prototype.hasOwnProperty.call(e, r) &&
            t.indexOf(r) < 0 &&
            (n[r] = e[r]);
    if (e != null && typeof Object.getOwnPropertySymbols == 'function')
        for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
            t.indexOf(r[o]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(e, r[o]) &&
                (n[r[o]] = e[r[o]]);
    return n;
};
T((e, t) => {
    var { className: n, spacing: r, as: o = 'p' } = e,
        a = po(e, ['className', 'spacing', 'as']);
    const { cn: i } = W();
    return v.createElement(
        o,
        Object.assign({}, a, {
            ref: t,
            className: i(n, 'navds-ingress', { 'navds-typo--spacing': !!r }),
        })
    );
});
var mo = function (e, t) {
    var n = {};
    for (var r in e)
        Object.prototype.hasOwnProperty.call(e, r) &&
            t.indexOf(r) < 0 &&
            (n[r] = e[r]);
    if (e != null && typeof Object.getOwnPropertySymbols == 'function')
        for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
            t.indexOf(r[o]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(e, r[o]) &&
                (n[r[o]] = e[r[o]]);
    return n;
};
const Vn = T((e, t) => {
    var {
            className: n,
            size: r = 'medium',
            as: o = 'label',
            spacing: a,
            visuallyHidden: i,
            textColor: l,
        } = e,
        u = mo(e, [
            'className',
            'size',
            'as',
            'spacing',
            'visuallyHidden',
            'textColor',
        ]);
    const { cn: c } = W();
    return v.createElement(
        o,
        Object.assign({}, u, {
            ref: t,
            className: c(
                n,
                'navds-label',
                ve({ spacing: a, visuallyHidden: i, textColor: l }),
                { 'navds-label--small': r === 'small' }
            ),
        })
    );
});
function ht(e, t) {
    const n = Object.entries(e).filter(([r]) => !t.includes(r));
    return Object.fromEntries(n);
}
let Kt = 0;
function vo(e) {
    const [t, n] = Z(e),
        r = e || t;
    return (
        pe(() => {
            t == null && ((Kt += 1), n(`aksel-icon-${Kt}`));
        }, [t]),
        r
    );
}
const qt = v.useId;
function gt(e) {
    var t;
    return qt !== void 0
        ? qt().replace(/(:)/g, '')
        : (t = vo(e)) !== null && t !== void 0
          ? t
          : '';
}
var ho = function (e, t) {
    var n = {};
    for (var r in e)
        Object.prototype.hasOwnProperty.call(e, r) &&
            t.indexOf(r) < 0 &&
            (n[r] = e[r]);
    if (e != null && typeof Object.getOwnPropertySymbols == 'function')
        for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
            t.indexOf(r[o]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(e, r[o]) &&
                (n[r[o]] = e[r[o]]);
    return n;
};
const go = T((e, t) => {
    var { title: n, titleId: r } = e,
        o = ho(e, ['title', 'titleId']);
    let a = gt();
    return (
        (a = n ? r || 'title-' + a : void 0),
        v.createElement(
            'svg',
            Object.assign(
                {
                    xmlns: 'http://www.w3.org/2000/svg',
                    width: '1em',
                    height: '1em',
                    fill: 'none',
                    viewBox: '0 0 24 24',
                    focusable: !1,
                    role: 'img',
                    ref: t,
                    'aria-labelledby': a,
                },
                o
            ),
            n ? v.createElement('title', { id: a }, n) : null,
            v.createElement('path', {
                fill: 'currentColor',
                fillRule: 'evenodd',
                d: 'M5.97 9.47a.75.75 0 0 1 1.06 0L12 14.44l4.97-4.97a.75.75 0 1 1 1.06 1.06l-5.5 5.5a.75.75 0 0 1-1.06 0l-5.5-5.5a.75.75 0 0 1 0-1.06',
                clipRule: 'evenodd',
            })
        )
    );
});
var yo = function (e, t) {
    var n = {};
    for (var r in e)
        Object.prototype.hasOwnProperty.call(e, r) &&
            t.indexOf(r) < 0 &&
            (n[r] = e[r]);
    if (e != null && typeof Object.getOwnPropertySymbols == 'function')
        for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
            t.indexOf(r[o]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(e, r[o]) &&
                (n[r[o]] = e[r[o]]);
    return n;
};
const Hn = T((e, t) => {
    var { title: n, titleId: r } = e,
        o = yo(e, ['title', 'titleId']);
    let a = gt();
    return (
        (a = n ? r || 'title-' + a : void 0),
        v.createElement(
            'svg',
            Object.assign(
                {
                    xmlns: 'http://www.w3.org/2000/svg',
                    width: '1em',
                    height: '1em',
                    fill: 'none',
                    viewBox: '0 0 24 24',
                    focusable: !1,
                    role: 'img',
                    ref: t,
                    'aria-labelledby': a,
                },
                o
            ),
            n ? v.createElement('title', { id: a }, n) : null,
            v.createElement('path', {
                fill: 'currentColor',
                fillRule: 'evenodd',
                d: 'M10.5 3.25a7.25 7.25 0 1 0 4.569 12.88l5.411 5.41a.75.75 0 1 0 1.06-1.06l-5.41-5.411A7.25 7.25 0 0 0 10.5 3.25M4.75 10.5a5.75 5.75 0 1 1 11.5 0 5.75 5.75 0 0 1-11.5 0',
                clipRule: 'evenodd',
            })
        )
    );
});
var bo = function (e, t) {
    var n = {};
    for (var r in e)
        Object.prototype.hasOwnProperty.call(e, r) &&
            t.indexOf(r) < 0 &&
            (n[r] = e[r]);
    if (e != null && typeof Object.getOwnPropertySymbols == 'function')
        for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
            t.indexOf(r[o]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(e, r[o]) &&
                (n[r[o]] = e[r[o]]);
    return n;
};
const Qt = T((e, t) => {
    var { title: n, titleId: r } = e,
        o = bo(e, ['title', 'titleId']);
    let a = gt();
    return (
        (a = n ? r || 'title-' + a : void 0),
        v.createElement(
            'svg',
            Object.assign(
                {
                    xmlns: 'http://www.w3.org/2000/svg',
                    width: '1em',
                    height: '1em',
                    fill: 'none',
                    viewBox: '0 0 24 24',
                    focusable: !1,
                    role: 'img',
                    ref: t,
                    'aria-labelledby': a,
                },
                o
            ),
            n ? v.createElement('title', { id: a }, n) : null,
            v.createElement('path', {
                fill: 'currentColor',
                d: 'M6.53 5.47a.75.75 0 0 0-1.06 1.06L10.94 12l-5.47 5.47a.75.75 0 1 0 1.06 1.06L12 13.06l5.47 5.47a.75.75 0 1 0 1.06-1.06L13.06 12l5.47-5.47a.75.75 0 0 0-1.06-1.06L12 10.94z',
            })
        )
    );
});
function yt(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
    return function (o) {
        if ((e?.(o), n === !1 || !o.defaultPrevented)) return t?.(o);
    };
}
function Ge(e) {
    return (t = {}) => {
        const n = t.width ? String(t.width) : e.defaultWidth;
        return e.formats[n] || e.formats[e.defaultWidth];
    };
}
function be(e) {
    return (t, n) => {
        const r = n?.context ? String(n.context) : 'standalone';
        let o;
        if (r === 'formatting' && e.formattingValues) {
            const i = e.defaultFormattingWidth || e.defaultWidth,
                l = n?.width ? String(n.width) : i;
            o = e.formattingValues[l] || e.formattingValues[i];
        } else {
            const i = e.defaultWidth,
                l = n?.width ? String(n.width) : e.defaultWidth;
            o = e.values[l] || e.values[i];
        }
        const a = e.argumentCallback ? e.argumentCallback(t) : t;
        return o[a];
    };
}
function ke(e) {
    return (t, n = {}) => {
        const r = n.width,
            o =
                (r && e.matchPatterns[r]) ||
                e.matchPatterns[e.defaultMatchWidth],
            a = t.match(o);
        if (!a) return null;
        const i = a[0],
            l =
                (r && e.parsePatterns[r]) ||
                e.parsePatterns[e.defaultParseWidth],
            u = Array.isArray(l)
                ? wo(l, (s) => s.test(i))
                : ko(l, (s) => s.test(i));
        let c;
        ((c = e.valueCallback ? e.valueCallback(u) : u),
            (c = n.valueCallback ? n.valueCallback(c) : c));
        const d = t.slice(i.length);
        return { value: c, rest: d };
    };
}
function ko(e, t) {
    for (const n in e)
        if (Object.prototype.hasOwnProperty.call(e, n) && t(e[n])) return n;
}
function wo(e, t) {
    for (let n = 0; n < e.length; n++) if (t(e[n])) return n;
}
function Oo(e) {
    return (t, n = {}) => {
        const r = t.match(e.matchPattern);
        if (!r) return null;
        const o = r[0],
            a = t.match(e.parsePattern);
        if (!a) return null;
        let i = e.valueCallback ? e.valueCallback(a[0]) : a[0];
        i = n.valueCallback ? n.valueCallback(i) : i;
        const l = t.slice(o.length);
        return { value: i, rest: l };
    };
}
const So = {
        lessThanXSeconds: {
            one: 'mindre enn ett sekund',
            other: 'mindre enn {{count}} sekunder',
        },
        xSeconds: { one: 'ett sekund', other: '{{count}} sekunder' },
        halfAMinute: 'et halvt minutt',
        lessThanXMinutes: {
            one: 'mindre enn ett minutt',
            other: 'mindre enn {{count}} minutter',
        },
        xMinutes: { one: 'ett minutt', other: '{{count}} minutter' },
        aboutXHours: {
            one: 'omtrent en time',
            other: 'omtrent {{count}} timer',
        },
        xHours: { one: 'en time', other: '{{count}} timer' },
        xDays: { one: 'en dag', other: '{{count}} dager' },
        aboutXWeeks: { one: 'omtrent en uke', other: 'omtrent {{count}} uker' },
        xWeeks: { one: 'en uke', other: '{{count}} uker' },
        aboutXMonths: {
            one: 'omtrent en måned',
            other: 'omtrent {{count}} måneder',
        },
        xMonths: { one: 'en måned', other: '{{count}} måneder' },
        aboutXYears: { one: 'omtrent ett år', other: 'omtrent {{count}} år' },
        xYears: { one: 'ett år', other: '{{count}} år' },
        overXYears: { one: 'over ett år', other: 'over {{count}} år' },
        almostXYears: { one: 'nesten ett år', other: 'nesten {{count}} år' },
    },
    Co = (e, t, n) => {
        let r;
        const o = So[e];
        return (
            typeof o == 'string'
                ? (r = o)
                : t === 1
                  ? (r = o.one)
                  : (r = o.other.replace('{{count}}', String(t))),
            n?.addSuffix
                ? n.comparison && n.comparison > 0
                    ? 'om ' + r
                    : r + ' siden'
                : r
        );
    },
    Eo = {
        full: 'EEEE d. MMMM y',
        long: 'd. MMMM y',
        medium: 'd. MMM y',
        short: 'dd.MM.y',
    },
    Po = {
        full: "'kl'. HH:mm:ss zzzz",
        long: 'HH:mm:ss z',
        medium: 'HH:mm:ss',
        short: 'HH:mm',
    },
    No = {
        full: "{{date}} 'kl.' {{time}}",
        long: "{{date}} 'kl.' {{time}}",
        medium: '{{date}} {{time}}',
        short: '{{date}} {{time}}',
    },
    $o = {
        date: Ge({ formats: Eo, defaultWidth: 'full' }),
        time: Ge({ formats: Po, defaultWidth: 'full' }),
        dateTime: Ge({ formats: No, defaultWidth: 'full' }),
    },
    xo = {
        lastWeek: "'forrige' eeee 'kl.' p",
        yesterday: "'i går kl.' p",
        today: "'i dag kl.' p",
        tomorrow: "'i morgen kl.' p",
        nextWeek: "EEEE 'kl.' p",
        other: 'P',
    },
    Io = (e, t, n, r) => xo[e],
    jo = {
        narrow: ['f.Kr.', 'e.Kr.'],
        abbreviated: ['f.Kr.', 'e.Kr.'],
        wide: ['før Kristus', 'etter Kristus'],
    },
    Ro = {
        narrow: ['1', '2', '3', '4'],
        abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
        wide: ['1. kvartal', '2. kvartal', '3. kvartal', '4. kvartal'],
    },
    Mo = {
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
    },
    To = {
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
    },
    Ao = {
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
    },
    Lo = (e, t) => Number(e) + '.',
    Do = {
        ordinalNumber: Lo,
        era: be({ values: jo, defaultWidth: 'wide' }),
        quarter: be({
            values: Ro,
            defaultWidth: 'wide',
            argumentCallback: (e) => e - 1,
        }),
        month: be({ values: Mo, defaultWidth: 'wide' }),
        day: be({ values: To, defaultWidth: 'wide' }),
        dayPeriod: be({ values: Ao, defaultWidth: 'wide' }),
    },
    Fo = /^(\d+)\.?/i,
    Uo = /\d+/i,
    Vo = {
        narrow: /^(f\.? ?Kr\.?|fvt\.?|e\.? ?Kr\.?|evt\.?)/i,
        abbreviated: /^(f\.? ?Kr\.?|fvt\.?|e\.? ?Kr\.?|evt\.?)/i,
        wide: /^(før Kristus|før vår tid|etter Kristus|vår tid)/i,
    },
    Ho = { any: [/^f/i, /^e/i] },
    zo = {
        narrow: /^[1234]/i,
        abbreviated: /^q[1234]/i,
        wide: /^[1234](\.)? kvartal/i,
    },
    Bo = { any: [/1/i, /2/i, /3/i, /4/i] },
    Wo = {
        narrow: /^[jfmasond]/i,
        abbreviated:
            /^(jan|feb|mars?|apr|mai|juni?|juli?|aug|sep|okt|nov|des)\.?/i,
        wide: /^(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)/i,
    },
    Ko = {
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
    },
    qo = {
        narrow: /^[smtofl]/i,
        short: /^(sø|ma|ti|on|to|fr|lø)/i,
        abbreviated: /^(søn|man|tir|ons|tor|fre|lør)/i,
        wide: /^(søndag|mandag|tirsdag|onsdag|torsdag|fredag|lørdag)/i,
    },
    Qo = { any: [/^s/i, /^m/i, /^ti/i, /^o/i, /^to/i, /^f/i, /^l/i] },
    Go = {
        narrow: /^(midnatt|middag|(på) (morgenen|ettermiddagen|kvelden|natten)|[ap])/i,
        any: /^([ap]\.?\s?m\.?|midnatt|middag|(på) (morgenen|ettermiddagen|kvelden|natten))/i,
    },
    Xo = {
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
    },
    Zo = {
        ordinalNumber: Oo({
            matchPattern: Fo,
            parsePattern: Uo,
            valueCallback: (e) => parseInt(e, 10),
        }),
        era: ke({
            matchPatterns: Vo,
            defaultMatchWidth: 'wide',
            parsePatterns: Ho,
            defaultParseWidth: 'any',
        }),
        quarter: ke({
            matchPatterns: zo,
            defaultMatchWidth: 'wide',
            parsePatterns: Bo,
            defaultParseWidth: 'any',
            valueCallback: (e) => e + 1,
        }),
        month: ke({
            matchPatterns: Wo,
            defaultMatchWidth: 'wide',
            parsePatterns: Ko,
            defaultParseWidth: 'any',
        }),
        day: ke({
            matchPatterns: qo,
            defaultMatchWidth: 'wide',
            parsePatterns: Qo,
            defaultParseWidth: 'any',
        }),
        dayPeriod: ke({
            matchPatterns: Go,
            defaultMatchWidth: 'any',
            parsePatterns: Xo,
            defaultParseWidth: 'any',
        }),
    },
    Jo = {
        code: 'nb',
        formatDistance: Co,
        formatLong: $o,
        formatRelative: Io,
        localize: Do,
        match: Zo,
        options: { weekStartsOn: 1, firstWeekContainsDate: 4 },
    },
    Yo = {
        global: {
            dateLocale: Jo,
            showMore: 'Vis mer',
            showLess: 'Vis mindre',
            readOnly: 'Skrivebeskyttet',
            close: 'Lukk',
            error: 'Feil',
            info: 'Informasjon',
            success: 'Suksess',
            warning: 'Advarsel',
            announcement: 'Kunngjøring',
        },
        Chips: { Removable: { labelSuffix: 'slett' } },
        Combobox: {
            addOption: 'Legg til',
            noMatches: 'Ingen søketreff',
            loading: 'Søker…',
            maxSelected: '{selected} av maks {limit} er valgt.',
        },
        CopyButton: { title: 'Kopier', activeText: 'Kopiert!' },
        DatePicker: {
            chooseDate: 'Velg dato',
            chooseDates: 'Velg datoer',
            chooseDateRange: 'Velg start- og sluttdato',
            chooseMonth: 'Velg måned',
            week: 'Uke',
            weekNumber: 'Uke {week}',
            selectWeekNumber: 'Velg uke {week}',
            month: 'Måned',
            goToNextMonth: 'Gå til neste måned',
            goToPreviousMonth: 'Gå til forrige måned',
            year: 'År',
            goToNextYear: 'Gå til neste år',
            goToPreviousYear: 'Gå til forrige år',
            openDatePicker: 'Åpne datovelger',
            openMonthPicker: 'Åpne månedsvelger',
            closeDatePicker: 'Lukk datovelger',
            closeMonthPicker: 'Lukk månedsvelger',
        },
        ErrorSummary: {
            heading: 'Du må rette disse feilene før du kan fortsette:',
        },
        FileUpload: {
            dropzone: {
                button: 'Velg fil',
                buttonMultiple: 'Velg filer',
                dragAndDrop: 'Dra og slipp filen her',
                dragAndDropMultiple: 'Dra og slipp filer her',
                drop: 'Slipp',
                or: 'eller',
                disabled: 'Filopplasting er deaktivert',
                disabledFilelimit: 'Du kan ikke laste opp flere filer',
            },
            item: {
                retryButtonTitle: 'Prøv å laste opp filen på nytt',
                deleteButtonTitle: 'Slett filen',
                uploading: 'Laster opp…',
                downloading: 'Laster ned…',
            },
        },
        FormProgress: {
            step: 'Steg {activeStep} av {totalSteps}',
            showAllSteps: 'Vis alle steg',
            hideAllSteps: 'Skjul alle steg',
        },
        FormSummary: { editAnswer: 'Endre svar' },
        GuidePanel: { illustrationLabel: 'Illustrasjon av veileder' },
        HelpText: { title: 'Mer informasjon' },
        Loader: { title: 'Venter…' },
        Pagination: { previous: 'Forrige', next: 'Neste' },
        Process: { active: 'Aktiv' },
        ProgressBar: {
            progress: '{current} av {max}',
            progressUnknown:
                'Fremdrift kan ikke beregnes, antatt tid er {seconds} sekunder.',
        },
        Search: { clear: 'Tøm feltet', search: 'Søk' },
        Textarea: {
            maxLength: 'Tekstområde med plass til {maxLength} tegn.',
            charsTooMany: '{chars} tegn for mye',
            charsLeft: '{chars} tegn igjen',
        },
        Timeline: {
            dateFormat: 'dd.MM.yyyy',
            dayFormat: 'dd.MM',
            monthFormat: 'MMM yy',
            yearFormat: 'yyyy',
            Row: { noPeriods: 'Ingen perioder', period: '{start} til {end}' },
            Period: {
                success: 'Suksess',
                warning: 'Advarsel',
                danger: 'Fare',
                info: 'Info',
                neutral: 'Nøytral',
                period: '{status} fra {start} til {end}',
            },
            Pin: { pin: 'Pin: {date}' },
            Zoom: {
                zoom: 'Zoom tidslinjen {start} til {end}',
                reset: 'Tilbakestill tidsperspektiv',
            },
        },
    },
    ea = fe({ locale: Yo }),
    ta = () => le(ea),
    Gt = /(\w+)/g;
function na(e, t) {
    const n = Array.isArray(e) ? e : ra(e);
    for (const r of t) {
        if (!r) continue;
        let o = r;
        for (let a = 0; a < n.length; a++) {
            const i = o[n[a]];
            i !== void 0 && (o = i);
        }
        if (typeof o == 'string') return o;
    }
    throw new Error(
        `Error translating key. Keypath '${e}' does not resolve to a string.`
    );
}
function ra(e) {
    const t = [];
    let n = Gt.exec(e);
    for (; n; ) {
        const [, r, o] = n;
        (t.push(r || o), (n = Gt.exec(e)));
    }
    return t;
}
const oa = /{[^}]*}/g;
function bt(e, ...t) {
    const n = ta(),
        r = n.translations || [],
        o = [
            ...t,
            ...(Array.isArray(r) ? r.map((i) => i[e]) : [r[e]]),
            n.locale[e],
        ];
    return (i, l) => {
        const u = na(i, o);
        return l
            ? u.replace(oa, (c) => {
                  const d = c.substring(1, c.length - 1);
                  if (l[d] === void 0) {
                      const s = JSON.stringify(l);
                      throw new Error(
                          `Error translating key '${i}'. No replacement syntax ({}) found for key '${d}'. The following replacements were passed: '${s}'`
                      );
                  }
                  return l[d];
              })
            : u;
    };
}
var aa = function (e, t) {
    var n = {};
    for (var r in e)
        Object.prototype.hasOwnProperty.call(e, r) &&
            t.indexOf(r) < 0 &&
            (n[r] = e[r]);
    if (e != null && typeof Object.getOwnPropertySymbols == 'function')
        for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
            t.indexOf(r[o]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(e, r[o]) &&
                (n[r[o]] = e[r[o]]);
    return n;
};
const ia = T((e, t) => {
    var {
            className: n,
            size: r = 'medium',
            title: o,
            transparent: a = !1,
            variant: i = 'neutral',
            id: l,
            'data-color': u,
        } = e,
        c = aa(e, [
            'className',
            'size',
            'title',
            'transparent',
            'variant',
            'id',
            'data-color',
        ]);
    const { cn: d } = W(),
        s = Dn(),
        f = bt('Loader');
    return v.createElement(
        'svg',
        Object.assign(
            {
                'aria-labelledby': l ?? `loader-${s}`,
                ref: t,
                className: d(
                    'navds-loader',
                    n,
                    `navds-loader--${r}`,
                    `navds-loader--${i}`,
                    { 'navds-loader--transparent': a }
                ),
                focusable: 'false',
                viewBox: '0 0 50 50',
                preserveAspectRatio: 'xMidYMid',
                'data-color': u ?? la(i),
            },
            ht(c, ['children']),
            { 'data-variant': i }
        ),
        v.createElement('title', { id: l ?? `loader-${s}` }, o || f('title')),
        v.createElement('circle', {
            className: d('navds-loader__background'),
            xmlns: 'http://www.w3.org/2000/svg',
            cx: '25',
            cy: '25',
            r: '20',
            fill: 'none',
        }),
        v.createElement('circle', {
            className: d('navds-loader__foreground'),
            cx: '25',
            cy: '25',
            r: '20',
            fill: 'none',
            strokeDasharray: '50 155',
        })
    );
});
function la(e) {
    switch (e) {
        case 'neutral':
            return 'neutral';
        case 'inverted':
            return 'neutral';
        case 'interaction':
            return;
        default:
            return 'neutral';
    }
}
var sa = function (e, t) {
    var n = {};
    for (var r in e)
        Object.prototype.hasOwnProperty.call(e, r) &&
            t.indexOf(r) < 0 &&
            (n[r] = e[r]);
    if (e != null && typeof Object.getOwnPropertySymbols == 'function')
        for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
            t.indexOf(r[o]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(e, r[o]) &&
                (n[r[o]] = e[r[o]]);
    return n;
};
const zn = T((e, t) => {
    var {
            as: n = 'button',
            variant: r = 'primary',
            className: o,
            children: a,
            size: i = 'medium',
            loading: l = !1,
            disabled: u,
            icon: c,
            iconPosition: d = 'left',
            onKeyUp: s,
            'data-color': f,
        } = e,
        m = sa(e, [
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
    const { cn: g } = W(),
        E = u || l ? ht(m, ['href']) : m,
        S = (b) => {
            b.key === ' ' && !u && !l && b.currentTarget.click();
        };
    return v.createElement(
        n,
        Object.assign(
            {},
            n !== 'button' ? { role: 'button' } : {},
            { 'data-color': f ?? ca(r), 'data-variant': ua(r) },
            E,
            {
                ref: t,
                onKeyUp: yt(s, S),
                className: g(
                    o,
                    'navds-button',
                    `navds-button--${r}`,
                    `navds-button--${i}`,
                    {
                        'navds-button--loading': l,
                        'navds-button--icon-only': !!c && !a,
                        'navds-button--disabled': u ?? l,
                    }
                ),
                disabled: (u ?? l) ? !0 : void 0,
            }
        ),
        c &&
            d === 'left' &&
            v.createElement('span', { className: g('navds-button__icon') }, c),
        l && v.createElement(ia, { size: i }),
        a &&
            v.createElement(
                Vn,
                { as: 'span', size: i === 'medium' ? 'medium' : 'small' },
                a
            ),
        c &&
            d === 'right' &&
            v.createElement('span', { className: g('navds-button__icon') }, c)
    );
});
function ca(e) {
    switch (e) {
        case 'primary-neutral':
        case 'secondary-neutral':
        case 'tertiary-neutral':
            return 'neutral';
        case 'danger':
            return 'danger';
        default:
            return;
    }
}
function ua(e) {
    switch (e) {
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
var da = function (e, t) {
    var n = {};
    for (var r in e)
        Object.prototype.hasOwnProperty.call(e, r) &&
            t.indexOf(r) < 0 &&
            (n[r] = e[r]);
    if (e != null && typeof Object.getOwnPropertySymbols == 'function')
        for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
            t.indexOf(r[o]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(e, r[o]) &&
                (n[r[o]] = e[r[o]]);
    return n;
};
const fa = T((e, t) => {
        var {
                className: n,
                header: r,
                children: o,
                open: a,
                defaultOpen: i = !1,
                onClick: l,
                size: u = 'medium',
                onOpenChange: c,
            } = e,
            d = da(e, [
                'className',
                'header',
                'children',
                'open',
                'defaultOpen',
                'onClick',
                'size',
                'onOpenChange',
            ]);
        const { cn: s } = W(),
            [f, m] = Wr({ defaultValue: i, value: a, onChange: c }),
            g = u === 'small' ? 'small' : 'medium';
        return v.createElement(
            'div',
            {
                className: s('navds-read-more', `navds-read-more--${u}`, n, {
                    'navds-read-more--open': f,
                }),
                'data-volume': 'low',
            },
            v.createElement(
                'button',
                Object.assign({}, d, {
                    ref: t,
                    type: 'button',
                    className: s(
                        'navds-read-more__button',
                        'navds-body-short',
                        { 'navds-body-short--small': u === 'small' }
                    ),
                    onClick: yt(l, () => m((E) => !E)),
                    'aria-expanded': f,
                    'data-state': f ? 'open' : 'closed',
                }),
                v.createElement(go, {
                    className: s('navds-read-more__expand-icon'),
                    'aria-hidden': !0,
                }),
                v.createElement('span', null, r)
            ),
            v.createElement(
                vt,
                {
                    as: 'div',
                    tabIndex: 0,
                    className: s('navds-read-more__content', {
                        'navds-read-more__content--closed': !f,
                    }),
                    size: g,
                    'data-state': f ? 'open' : 'closed',
                },
                o
            )
        );
    }),
    _a = fe(null),
    pa = (e, t) => {
        var n, r, o;
        const { size: a, error: i, errorId: l } = e,
            u = le(_a),
            c = Dn(),
            d = (n = e.id) !== null && n !== void 0 ? n : `${t}-${c}`,
            s = l ?? `${t}-error-${c}`,
            f = `${t}-description-${c}`,
            m = u?.disabled || e.disabled,
            g = ((u?.readOnly || e.readOnly) && !m) || void 0,
            E = !m && !g && !!(i || u?.error),
            S = !m && !g && !!i && typeof i != 'boolean',
            b = Object.assign({}, E ? { 'aria-invalid': !0 } : {});
        return (
            e?.required,
            {
                showErrorMsg: S,
                hasError: E,
                errorId: s,
                inputDescriptionId: f,
                size:
                    (r = a ?? u?.size) !== null && r !== void 0 ? r : 'medium',
                readOnly: g,
                inputProps: Object.assign(Object.assign({ id: d }, b), {
                    'aria-describedby':
                        xe(e['aria-describedby'], {
                            [f]: e.description && !ot(e.description),
                            [s]: S,
                            [(o = u?.errorId) !== null && o !== void 0
                                ? o
                                : '']: E && u?.error,
                        }) || void 0,
                    disabled: m,
                }),
            }
        );
    };
function ot(e, t = !0) {
    if (v.isValidElement(e)) {
        if (e.type === fa) return !0;
        if (e.props.children && t) return ot(e.props.children, !1);
    } else if (Array.isArray(e)) return e.some((n) => ot(n, t));
    return !1;
}
var ma = function (e, t) {
    var n = {};
    for (var r in e)
        Object.prototype.hasOwnProperty.call(e, r) &&
            t.indexOf(r) < 0 &&
            (n[r] = e[r]);
    if (e != null && typeof Object.getOwnPropertySymbols == 'function')
        for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
            t.indexOf(r[o]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(e, r[o]) &&
                (n[r[o]] = e[r[o]]);
    return n;
};
const va = T((e, t) => {
    var {
            as: n = 'a',
            className: r,
            underline: o = !0,
            variant: a,
            inlineText: i = !1,
            'data-color': l,
        } = e,
        u = ma(e, [
            'as',
            'className',
            'underline',
            'variant',
            'inlineText',
            'data-color',
        ]);
    const c = mt(),
        { cn: d } = W();
    let s;
    return (
        c?.isDarkside ? (s = a) : (s = a ?? 'action'),
        v.createElement(
            n,
            Object.assign({ 'data-color': l ?? ha(s), 'data-variant': s }, u, {
                ref: t,
                className: d('navds-link', r, {
                    [`navds-link--${s}`]: s,
                    'navds-link--remove-underline': !o,
                    'navds-link--inline-text': i,
                }),
            })
        )
    );
});
function ha(e) {
    switch (e) {
        case 'action':
            return 'accent';
        case 'neutral':
            return 'neutral';
        case 'subtle':
            return 'neutral';
        default:
            return;
    }
}
const Bn = fe(null);
var ga = function (e, t) {
    var n = {};
    for (var r in e)
        Object.prototype.hasOwnProperty.call(e, r) &&
            t.indexOf(r) < 0 &&
            (n[r] = e[r]);
    if (e != null && typeof Object.getOwnPropertySymbols == 'function')
        for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
            t.indexOf(r[o]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(e, r[o]) &&
                (n[r[o]] = e[r[o]]);
    return n;
};
const Wn = T((e, t) => {
    var n,
        { className: r, children: o, disabled: a, onClick: i } = e,
        l = ga(e, ['className', 'children', 'disabled', 'onClick']);
    const { cn: u } = W(),
        c = bt('Search'),
        d = le(Bn);
    if (d === null)
        return (
            console.warn('<Search.Button> has to be wrapped in <Search />'),
            null
        );
    const { size: s, variant: f, handleClick: m } = d;
    return v.createElement(
        zn,
        Object.assign({ type: 'submit' }, l, {
            ref: t,
            size: s,
            variant: f === 'secondary' ? 'secondary' : 'primary',
            className: u('navds-search__button-search', r),
            disabled: (n = d?.disabled) !== null && n !== void 0 ? n : a,
            onClick: yt(i, m),
            icon: v.createElement(
                Hn,
                Object.assign(
                    {},
                    o ? { 'aria-hidden': !0 } : { title: c('search') }
                )
            ),
        }),
        o
    );
});
var ya = function (e, t) {
    var n = {};
    for (var r in e)
        Object.prototype.hasOwnProperty.call(e, r) &&
            t.indexOf(r) < 0 &&
            (n[r] = e[r]);
    if (e != null && typeof Object.getOwnPropertySymbols == 'function')
        for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
            t.indexOf(r[o]) < 0 &&
                Object.prototype.propertyIsEnumerable.call(e, r[o]) &&
                (n[r[o]] = e[r[o]]);
    return n;
};
const Kn = T((e, t) => {
    const {
            inputProps: n,
            size: r = 'medium',
            inputDescriptionId: o,
            errorId: a,
            showErrorMsg: i,
            hasError: l,
        } = pa(e, 'searchfield'),
        {
            className: u,
            hideLabel: c = !0,
            label: d,
            description: s,
            value: f,
            clearButtonLabel: m,
            onClear: g,
            clearButton: E = !0,
            children: S,
            variant: b = 'primary',
            defaultValue: O,
            onChange: D,
            onSearchClick: F,
            htmlSize: y,
            'data-color': P,
        } = e,
        U = ya(e, [
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
        ]),
        { cn: j } = W(),
        A = $e(null),
        K = Ln(A, t),
        [x, R] = Z(O ?? ''),
        L = (V) => {
            (f === void 0 && R(V), D?.(V));
        },
        Q = (V) => {
            var z, re;
            (g?.(V),
                L(''),
                (re =
                    (z = A.current) === null || z === void 0
                        ? void 0
                        : z.focus) === null ||
                    re === void 0 ||
                    re.call(z));
        },
        se = () => {
            F?.(`${f ?? x}`);
        },
        J = E && !n.disabled && (f ?? x);
    return v.createElement(
        'div',
        {
            onKeyDown: (V) => {
                var z;
                V.key === 'Escape' &&
                    (!((z = A.current) === null || z === void 0) &&
                        z.value &&
                        V.preventDefault(),
                    Q({ trigger: 'Escape', event: V }));
            },
            className: j(
                u,
                'navds-form-field',
                `navds-form-field--${r}`,
                'navds-search',
                {
                    'navds-search--error': l,
                    'navds-search--disabled': n.disabled,
                    'navds-search--with-size': y,
                }
            ),
            'data-color': P,
        },
        v.createElement(
            Vn,
            {
                htmlFor: n.id,
                size: r,
                className: j('navds-form-field__label', { 'navds-sr-only': c }),
            },
            d
        ),
        !!s &&
            v.createElement(
                He,
                {
                    className: j('navds-form-field__description', {
                        'navds-sr-only': c,
                    }),
                    id: o,
                    size: r,
                    as: 'div',
                },
                s
            ),
        v.createElement(
            'div',
            { className: j('navds-search__wrapper') },
            v.createElement(
                'div',
                { className: j('navds-search__wrapper-inner') },
                b === 'simple' &&
                    v.createElement(Hn, {
                        'aria-hidden': !0,
                        className: j('navds-search__search-icon'),
                    }),
                v.createElement(
                    'input',
                    Object.assign(
                        { ref: K },
                        ht(U, ['error', 'errorId', 'size', 'readOnly']),
                        n,
                        {
                            value: f ?? x,
                            onChange: (V) => L(V.target.value),
                            type: 'search',
                            className: j(
                                u,
                                'navds-search__input',
                                `navds-search__input--${b}`,
                                'navds-text-field__input',
                                'navds-body-short',
                                `navds-body-short--${r}`
                            ),
                        },
                        y ? { size: Number(y) } : {}
                    )
                ),
                J &&
                    v.createElement(ba, {
                        handleClear: Q,
                        size: r,
                        clearButtonLabel: m,
                    })
            ),
            v.createElement(
                Bn.Provider,
                {
                    value: {
                        size: r,
                        disabled: n.disabled,
                        variant: b,
                        handleClick: se,
                    },
                },
                S ||
                    (b !== 'simple' && v.createElement(Wn, { 'data-color': P }))
            )
        ),
        v.createElement(
            'div',
            {
                className: j('navds-form-field__error'),
                id: a,
                'aria-relevant': 'additions removals',
                'aria-live': 'polite',
            },
            i && v.createElement(uo, { size: r, showIcon: !0 }, e.error)
        )
    );
});
function ba({ size: e, clearButtonLabel: t, handleClear: n }) {
    const { cn: r } = W(),
        o = mt(),
        a = bt('Search');
    return o?.isDarkside
        ? v.createElement(zn, {
              className: r('navds-search__button-clear'),
              variant: 'tertiary',
              'data-color': 'neutral',
              size: e === 'medium' ? 'small' : 'xsmall',
              icon: v.createElement(Qt, { 'aria-hidden': !0 }),
              title: t || a('clear'),
              onClick: (i) => n({ trigger: 'Click', event: i }),
              type: 'button',
          })
        : v.createElement(
              'button',
              {
                  type: 'button',
                  onClick: (i) => n({ trigger: 'Click', event: i }),
                  className: r('navds-search__button-clear'),
              },
              v.createElement(
                  'span',
                  { className: r('navds-sr-only') },
                  t || a('clear')
              ),
              v.createElement(Qt, { 'aria-hidden': !0 })
          );
}
Kn.Button = Wn;
const qn = fe('nb'),
    ka = () => le(qn),
    wa = (e) => _(qn.Provider, { ...e }),
    Oa = {
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
        postnrResultNone: (e, t) =>
            _(C, {
                children: [
                    'Ingen Nav-kontor funnet for ',
                    _('strong', { children: e }),
                    t && ` med gatenavn ${t}`,
                ],
            }),
        postnrResultOne: (e) =>
            _(C, {
                children: [
                    'Nav-kontor for ',
                    _('strong', { children: e }),
                    ':',
                ],
            }),
        postnrResultMany: (e, t, n) =>
            _(C, {
                children: [
                    `${e} kontorer dekker `,
                    _('strong', { children: t }),
                    `. Du kan legge til gatenavn og husnummer for å spisse søket, f.eks. ${n} Eksempelgata 12`,
                ],
            }),
        postnrResultPostbox: (e, t, n) =>
            _(C, {
                children: [
                    `${e} er et postnummer for postbokser i `,
                    _('strong', { children: t }),
                    ` kommune. Kommunens Nav-kontor${Number(n) > 1 ? 'er' : ''}:`,
                ],
            }),
        postnrResultServiceBox: (e, t, n) =>
            _(C, {
                children: [
                    `${e} er et servicepostnummer i `,
                    _('strong', { children: t }),
                    ` kommune. Kommunens Nav-kontor${Number(n) > 1 ? 'er' : ''}:`,
                ],
            }),
        postnrResultBydeler: (e, t, n) =>
            _(C, {
                children: [
                    'Fant ingen kontor spesifikt tilknyttet ',
                    _('strong', { children: e }),
                    ' i ',
                    _('strong', { children: t }),
                    ` kommune. ${Number(n) > 1 ? 'Alle k' : 'K'}ommunens Nav-kontor${Number(n) > 1 ? 'er' : ''}:`,
                ],
            }),
        nameResultNone: (e) => `Ingen resultater for "${e}"`,
        nameResultFound: (e, t) => `Søkeresultat for "${e}" (${t}):`,
    },
    Sa = {
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
        postnrResultNone: (e, t) =>
            _(C, {
                children: [
                    'Ingen Nav-kontor funne for ',
                    _('strong', { children: e }),
                    t && ` med gatenamn ${t}`,
                ],
            }),
        postnrResultOne: (e) =>
            _(C, {
                children: [
                    'Nav-kontor for ',
                    _('strong', { children: e }),
                    ':',
                ],
            }),
        postnrResultMany: (e, t, n) =>
            _(C, {
                children: [
                    `${e} kontor dekker `,
                    _('strong', { children: t }),
                    `. Du kan legge til gatenamn og husnummer for å spisse søket, t.d. ${n} Eksempelgata 12`,
                ],
            }),
        postnrResultPostbox: (e, t, n) =>
            _(C, {
                children: [
                    `${e} er eit postnummer for postboksar i `,
                    _('strong', { children: t }),
                    ` kommune. Kommunens Nav-kontor${Number(n) > 1 ? 'er' : ''}:`,
                ],
            }),
        postnrResultServiceBox: (e, t, n) =>
            _(C, {
                children: [
                    `${e} er eit servicepostnummer i `,
                    _('strong', { children: t }),
                    ` kommune. Kommunens Nav-kontor${Number(n) > 1 ? 'er' : ''}:`,
                ],
            }),
        postnrResultBydeler: (e, t, n) =>
            _(C, {
                children: [
                    'Fant ingen kontor spesifikt knytta til ',
                    _('strong', { children: e }),
                    ' i ',
                    _('strong', { children: t }),
                    ` kommune. ${Number(n) > 1 ? 'Alle k' : 'K'}ommunens Nav-kontor${Number(n) > 1 ? 'er' : ''}:`,
                ],
            }),
        nameResultNone: (e) => `Ingen resultat for "${e}"`,
        nameResultFound: (e, t) => `Søkeresultat for "${e}" (${t}):`,
    },
    Ca = {
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
        postnrResultNone: (e, t) =>
            _(C, {
                children: [
                    'No Nav office found for ',
                    _('strong', { children: e }),
                    t && ` with street name ${t}`,
                ],
            }),
        postnrResultOne: (e) =>
            _(C, {
                children: [
                    'Nav office for ',
                    _('strong', { children: e }),
                    ':',
                ],
            }),
        postnrResultMany: (e, t, n) =>
            _(C, {
                children: [
                    `${e} offices cover `,
                    _('strong', { children: t }),
                    `. You can add a street name and building number to narrow the search, e.g. ${n} Example-street 12`,
                ],
            }),
        postnrResultPostbox: (e, t, n) =>
            _(C, {
                children: [
                    `${e} is a post code for PO boxes in `,
                    _('strong', { children: t }),
                    `. Nav office${Number(n) > 1 ? 's' : ''} for this town/city:`,
                ],
            }),
        postnrResultServiceBox: (e, t, n) =>
            _(C, {
                children: [
                    `${e} is a service post code in `,
                    _('strong', { children: t }),
                    `. Nav office${Number(n) > 1 ? 's' : ''} for this town/city:`,
                ],
            }),
        postnrResultBydeler: (e, t, n) =>
            _(C, {
                children: [
                    'No specific office found for ',
                    _('strong', { children: e }),
                    ' in ',
                    _('strong', { children: t }),
                    `. ${Number(n) > 1 ? 'All ' : ''}Nav office${Number(n) > 1 ? 's' : ''} for this town/city:`,
                ],
            }),
        nameResultNone: (e) => `No results for "${e}"`,
        nameResultFound: (e, t) => `Search results for "${e}" (${t}):`,
    },
    Ea = { nb: Oa, nn: Sa, en: Ca },
    Fe = (e, t, n = []) => {
        const r = Ea[t][e];
        return typeof r == 'function' ? r(...n) : r;
    },
    H = ({ id: e, args: t = [] }) => {
        const n = ka();
        return _(C, { children: Fe(e, n, t) });
    },
    Pa = (e) =>
        _('svg', {
            width: '24',
            height: '24',
            viewBox: '0 0 24 24',
            fill: 'currentColor',
            ...e,
            children: _('path', {
                fillRule: 'evenodd',
                clipRule: 'evenodd',
                d: 'M17.4142 12L9.70708 19.7071L8.29286 18.2929L14.5858 12L8.29286 5.70711L9.70708 4.29289L17.4142 12Z',
            }),
        }),
    Na = '_link_pxvs7_1',
    $a = '_chevron_pxvs7_18',
    Xt = { link: Na, chevron: $a },
    Qn = ({ officeInfo: e }) => {
        const { url: t, name: n } = e;
        return _(va, {
            href: t,
            className: Xt.link,
            children: [
                _(Pa, { className: Xt.chevron, 'aria-hidden': !0 }),
                _(He, { children: n }),
            ],
        });
    };
var at = ((e) => (
    (e.GateadresserOgPostbokser = 'B'),
    (e.Felles = 'F'),
    (e.Gateadresser = 'G'),
    (e.Postbokser = 'P'),
    (e.Servicepostnummer = 'S'),
    e
))(at || {});
const xa = '_header_142he_1',
    Ia = { header: xa },
    ja = (e) => {
        const {
                postnr: t,
                poststed: n,
                kommuneNavn: r,
                kategori: o,
                officeInfo: a,
                adresseQuery: i = '',
                withAllBydeler: l,
            } = e,
            u = `${t} ${n}`,
            c = a.length;
        return c === 0
            ? _(H, { id: 'postnrResultNone', args: [u, i] })
            : c > 1
              ? o === at.Postbokser
                  ? _(H, {
                        id: 'postnrResultPostbox',
                        args: [t, r, c.toString()],
                    })
                  : o === at.Servicepostnummer
                    ? _(H, {
                          id: 'postnrResultServiceBox',
                          args: [t, r, c.toString()],
                      })
                    : l
                      ? _(H, {
                            id: 'postnrResultBydeler',
                            args: [t, r, c.toString()],
                        })
                      : _(H, {
                            id: 'postnrResultMany',
                            args: [c.toString(), u, t],
                        })
              : _(H, { id: 'postnrResultOne', args: [u] });
    },
    Ra = ({ result: e }) => {
        const { officeInfo: t, adresseQuery: n } = e;
        return t
            ? _('div', {
                  children: [
                      _(vt, {
                          className: Ia.header,
                          children: _(ja, { ...e }),
                      }),
                      t.map((r) =>
                          _(
                              C,
                              {
                                  children: [
                                      n &&
                                          _(He, {
                                              size: 'small',
                                              children: `${r.hitString}:`,
                                          }),
                                      _(Qn, { officeInfo: r }),
                                  ],
                              },
                              r.enhetNr
                          )
                      ),
                  ],
              })
            : _('div', { children: _(H, { id: 'errorInvalidResult' }) });
    },
    Gn = {
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
    },
    Ma = Object.keys(Gn).reduce((e, t) => e + t, ''),
    Ta = new RegExp(`[${Ma}]`, 'g'),
    Aa = (e) => {
        const t = Gn[e];
        return t !== void 0 ? t : e;
    },
    Xn = (e) => (e ? e.toLowerCase().replace(Ta, Aa) : ''),
    La = '_header_btl41_1',
    Da = '_hitname_btl41_5',
    Zt = { header: La, hitname: Da },
    Fa = ({ name: e, normalizedInput: t }) => {
        const r = Xn(e).indexOf(t);
        if (r === -1) return _(C, { children: e });
        const o = e.slice(0, r),
            a = e.slice(r, r + t.length),
            i = e.slice(r + t.length);
        return _(C, { children: [o, _('strong', { children: a }), i] });
    },
    Ua = ({ result: e }) => {
        const { input: t, hits: n } = e;
        if (!n)
            return _('div', { children: _(H, { id: 'errorInvalidResult' }) });
        const r = Xn(t),
            o = n.length;
        return _('div', {
            children: [
                _('div', {
                    className: Zt.header,
                    children:
                        o === 0
                            ? _(H, { id: 'nameResultNone', args: [t] })
                            : _(H, {
                                  id: 'nameResultFound',
                                  args: [t, o.toString()],
                              }),
                }),
                n.map((a) =>
                    _(
                        C,
                        {
                            children: [
                                _(He, {
                                    size: 'medium',
                                    className: Zt.hitname,
                                    children: _(Fa, {
                                        name: a.name.toUpperCase(),
                                        normalizedInput: r,
                                    }),
                                }),
                                a.officeHits.map((i) =>
                                    _(Qn, { officeInfo: i }, i.enhetNr)
                                ),
                            ],
                        },
                        a.name
                    )
                ),
            ],
        });
    },
    Va = ({ searchResult: e }) =>
        e.type === 'postnr'
            ? _(Ra, { result: e })
            : e.type === 'name'
              ? _(Ua, { result: e })
              : null,
    it = {
        appPath: { nb: void 0, nn: 'undefined/nn', en: 'undefined/en' },
        searchApi: 'undefinedundefined/api/search',
        kontaktOss: 'undefined/person/kontakt-oss',
    };
let lt = typeof window < 'u' ? new AbortController() : null;
const Zn = () => lt?.abort(),
    Ha = (e) => (
        Zn(),
        (lt = new AbortController()),
        fetch(`${it.searchApi}?query=${e}`, { signal: lt.signal })
            .then((t) => t.json())
            .catch((t) =>
                t.name === 'AbortError'
                    ? { type: 'error', aborted: !0 }
                    : { type: 'error', messageId: 'errorServerError' }
            )
    ),
    za = /^\d{4}$/,
    Ba = (e) => {
        if (!e) return !1;
        const t = e.split(' ')[0];
        return t && za.test(t);
    },
    Wa = new RegExp('^(\\p{Letter}|\\.|-| ){2,}$', 'u'),
    Ka = (e) => e && Wa.test(e),
    qa = '_searchForm_44ho5_1',
    Qa = '_searchField_44ho5_8',
    Ga = '_searchResult_44ho5_19',
    Xa = '_error_44ho5_27',
    Me = { searchForm: qa, searchField: Qa, searchResult: Ga, error: Xa },
    Za = (e) => typeof e == 'string' && e.length === 0,
    Ja = (e) => typeof e == 'string' && e.length >= 2,
    Ya = () => {
        const [e, t] = Z(),
            [n, r] = Z(),
            o = $e(null),
            a = (s) => {
                r({ id: s, type: 'clientError' });
            },
            i = (s) => {
                r({ id: s, type: 'serverError' });
            },
            l = () => {
                r(null);
            },
            u = (s) => {
                const f = o.current?.value;
                if (
                    (Zn(), c.cancel && c.cancel(), Za(f) && t(void 0), !Ja(f))
                ) {
                    s ? a('errorInputValidationLength') : l();
                    return;
                }
                if (Ba(f)) {
                    c(f);
                    return;
                } else if (!isNaN(Number(f))) {
                    s ? a('errorInputValidationPostnr') : l();
                    return;
                }
                if (!Ka(f)) {
                    a('errorInputValidationName');
                    return;
                }
                c(f);
            },
            c = Vr((s) => {
                (l(),
                    Ha(s).then((f) => {
                        if (f.type === 'error') {
                            if (f.aborted) return;
                            (t(void 0), i(f.messageId || 'errorServerError'));
                        } else t(f);
                    }));
            }, 500),
            d = (s) => {
                (s.preventDefault(), u(!0));
            };
        return _('div', {
            className: Me.searchForm,
            children: [
                _('form', {
                    onSubmit: d,
                    className: Me.searchField,
                    children: _(Kn, {
                        variant: 'primary',
                        hideLabel: !1,
                        label: _(H, { id: 'inputLabel' }),
                        id: 'search-input',
                        autoComplete: 'off',
                        ref: o,
                        onChange: () => u(!1),
                        error: n?.type === 'clientError' && _(H, { id: n.id }),
                    }),
                }),
                n?.type === 'serverError' &&
                    _('div', {
                        className: Me.error,
                        children: _(H, { id: n.id }),
                    }),
                e &&
                    _('div', {
                        className: Me.searchResult,
                        children: _(Va, { searchResult: e }),
                    }),
            ],
        });
    },
    ei = '_appContainer_17nha_1',
    ti = '_title_17nha_16',
    ni = '_ingress_17nha_22',
    Xe = { appContainer: ei, title: ti, ingress: ni },
    ri = () =>
        _('div', {
            className: Xe.appContainer,
            children: [
                _(_o, {
                    size: 'xlarge',
                    className: Xe.title,
                    children: _(H, { id: 'pageTitle' }),
                }),
                _(vt, {
                    className: Xe.ingress,
                    children: [
                        _(H, { id: 'ingressLine1' }),
                        _('br', {}),
                        _(H, { id: 'ingressLine2' }),
                    ],
                }),
                _(Ya, {}),
            ],
        });
var Oe = { exports: {} },
    Le = { exports: {} };
var oi = Le.exports,
    Jt;
function ai() {
    return (
        Jt ||
            ((Jt = 1),
            (function (e, t) {
                (function (n, r) {
                    e.exports = r();
                })(oi, function () {
                    function n(i) {
                        for (var l = 1; l < arguments.length; l++) {
                            var u = arguments[l];
                            for (var c in u) i[c] = u[c];
                        }
                        return i;
                    }
                    var r = {
                        read: function (i) {
                            return (
                                i[0] === '"' && (i = i.slice(1, -1)),
                                i.replace(
                                    /(%[\dA-F]{2})+/gi,
                                    decodeURIComponent
                                )
                            );
                        },
                        write: function (i) {
                            return encodeURIComponent(i).replace(
                                /%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g,
                                decodeURIComponent
                            );
                        },
                    };
                    function o(i, l) {
                        function u(d, s, f) {
                            if (!(typeof document > 'u')) {
                                ((f = n({}, l, f)),
                                    typeof f.expires == 'number' &&
                                        (f.expires = new Date(
                                            Date.now() + f.expires * 864e5
                                        )),
                                    f.expires &&
                                        (f.expires = f.expires.toUTCString()),
                                    (d = encodeURIComponent(d)
                                        .replace(
                                            /%(2[346B]|5E|60|7C)/g,
                                            decodeURIComponent
                                        )
                                        .replace(/[()]/g, escape)));
                                var m = '';
                                for (var g in f)
                                    f[g] &&
                                        ((m += '; ' + g),
                                        f[g] !== !0 &&
                                            (m += '=' + f[g].split(';')[0]));
                                return (document.cookie =
                                    d + '=' + i.write(s, d) + m);
                            }
                        }
                        function c(d) {
                            if (
                                !(
                                    typeof document > 'u' ||
                                    (arguments.length && !d)
                                )
                            ) {
                                for (
                                    var s = document.cookie
                                            ? document.cookie.split('; ')
                                            : [],
                                        f = {},
                                        m = 0;
                                    m < s.length;
                                    m++
                                ) {
                                    var g = s[m].split('='),
                                        E = g.slice(1).join('=');
                                    try {
                                        var S = decodeURIComponent(g[0]);
                                        if (((f[S] = i.read(E, S)), d === S))
                                            break;
                                    } catch {}
                                }
                                return d ? f[d] : f;
                            }
                        }
                        return Object.create(
                            {
                                set: u,
                                get: c,
                                remove: function (d, s) {
                                    u(d, '', n({}, s, { expires: -1 }));
                                },
                                withAttributes: function (d) {
                                    return o(
                                        this.converter,
                                        n({}, this.attributes, d)
                                    );
                                },
                                withConverter: function (d) {
                                    return o(
                                        n({}, this.converter, d),
                                        this.attributes
                                    );
                                },
                            },
                            {
                                attributes: { value: Object.freeze(l) },
                                converter: { value: Object.freeze(i) },
                            }
                        );
                    }
                    var a = o(r, { path: '/' });
                    return a;
                });
            })(Le)),
        Le.exports
    );
}
var ii = Oe.exports,
    Yt;
function li() {
    return (
        Yt ||
            ((Yt = 1),
            (function (e, t) {
                var n = {};
                (function (r, o) {
                    o(t, ai());
                })(ii, function (r, o) {
                    let a = !1;
                    const i = () =>
                            new Promise((p, h) => {
                                (typeof window > 'u' &&
                                    h(
                                        Error(
                                            'Missing window, can only be used client-side'
                                        )
                                    ),
                                    a && p(!0));
                                const w = () => {
                                    window.postMessage(
                                        {
                                            source: 'decoratorClient',
                                            event: 'ready',
                                        },
                                        window.location.origin
                                    );
                                };
                                (function B() {
                                    a || (setTimeout(B, 50), w());
                                })();
                                const $ = (B) => {
                                    const { data: ae } = B,
                                        Y = l(B),
                                        { source: ye, event: Jn } = ae;
                                    Y &&
                                        ye === 'decorator' &&
                                        Jn === 'ready' &&
                                        ((a = !0),
                                        window.removeEventListener(
                                            'message',
                                            $
                                        ),
                                        p(!0));
                                };
                                window.addEventListener('message', $);
                            }),
                        l = (p) => {
                            const { origin: h, source: w } = p;
                            return (
                                window.location.href.indexOf(h) === 0 &&
                                w === window
                            );
                        },
                        u = (p) =>
                            i()
                                .then(() =>
                                    window.postMessage(
                                        {
                                            source: 'decoratorClient',
                                            event: 'params',
                                            payload: p
                                                ? Object.entries(p).reduce(
                                                      (h, [w, $]) =>
                                                          $ !== void 0
                                                              ? { ...h, [w]: $ }
                                                              : h,
                                                      {}
                                                  )
                                                : {},
                                        },
                                        window.location.origin
                                    )
                                )
                                .catch((h) => console.warn(h)),
                        c = async () =>
                            i()
                                .then(() => window.__DECORATOR_DATA__.params)
                                .catch((p) => {
                                    console.warn(p);
                                }),
                        d = (() => {
                            let p;
                            const h = (w) => {
                                const { data: $ } = w,
                                    B = l(w),
                                    { source: ae, event: Y, payload: ye } = $;
                                B &&
                                    ae === 'decorator' &&
                                    Y === 'breadcrumbClick' &&
                                    p &&
                                    p(ye);
                            };
                            return (
                                typeof window < 'u' &&
                                    window.addEventListener('message', h),
                                (w) => {
                                    p = w;
                                }
                            );
                        })(),
                        s = (p) => u({ breadcrumbs: p }),
                        f = (() => {
                            let p;
                            const h = (w) => {
                                const { data: $ } = w,
                                    B = l(w),
                                    { source: ae, event: Y, payload: ye } = $;
                                B &&
                                    ae === 'decorator' &&
                                    Y === 'languageSelect' &&
                                    p &&
                                    p(ye);
                            };
                            return (
                                typeof window < 'u' &&
                                    window.addEventListener('message', h),
                                (w) => {
                                    p = w;
                                }
                            );
                        })(),
                        m = (p) => u({ availableLanguages: p }),
                        g = {
                            prod: 'https://www.nav.no/dekoratoren',
                            dev: 'https://dekoratoren.ekstern.dev.nav.no',
                            beta: 'https://dekoratoren-beta.intern.dev.nav.no',
                            betaTms:
                                'https://dekoratoren-beta-tms.intern.dev.nav.no',
                        },
                        E = {
                            prod: 'http://nav-dekoratoren.personbruker',
                            dev: 'http://nav-dekoratoren.personbruker',
                            beta: 'http://nav-dekoratoren-beta.personbruker',
                            betaTms:
                                'http://nav-dekoratoren-beta-tms.personbruker',
                        },
                        S = new Set(['dev-gcp', 'prod-gcp']),
                        b = (p) =>
                            p
                                ? Object.entries(p).reduce(
                                      (h, [w, $], B) =>
                                          $ !== void 0
                                              ? `${h}${B ? '&' : '?'}${w}=${encodeURIComponent(typeof $ == 'object' ? JSON.stringify($) : $)}`
                                              : h,
                                      ''
                                  )
                                : '',
                        O = () =>
                            typeof process < 'u' &&
                            n.NAIS_CLUSTER_NAME &&
                            S.has(n.NAIS_CLUSTER_NAME),
                        D = (p, h = !1, w = !0) =>
                            (w && !h && O() ? E[p] : g[p]) || g.prod,
                        F = (p) =>
                            p.env === 'localhost'
                                ? p.localUrl
                                : D(p.env, p.csr, p.serviceDiscovery),
                        y = (p) => {
                            const { params: h, csr: w } = p;
                            return `${F(p)}/${w ? 'csr' : 'ssr'}${b(h)}`;
                        },
                        P = (p) => {
                            const h = { ...p, csr: !0 },
                                w = y(h),
                                $ = y({ ...h, params: void 0 }),
                                B = `${$}/client.js`;
                            return {
                                header: '<div id="decorator-header"></div>',
                                footer: '<div id="decorator-footer"></div>',
                                env: `<div id="decorator-env" data-src="${w}"></div>`,
                                styles: `<link href="${$}/css/client.css" rel="stylesheet" />`,
                                scripts: `<script src="${B}" defer><\/script>`,
                                scriptSrc: B,
                            };
                        },
                        U = async (p) => {
                            const {
                                env: h,
                                header: w,
                                scriptSrc: $,
                                styles: B,
                                footer: ae,
                            } = P(p);
                            (document.head.insertAdjacentHTML('beforeend', B),
                                document.head.insertAdjacentHTML(
                                    'beforeend',
                                    h
                                ),
                                document.body.insertAdjacentHTML(
                                    'afterbegin',
                                    w
                                ),
                                document.body.insertAdjacentHTML(
                                    'beforeend',
                                    ae
                                ));
                            const Y = document.createElement('script');
                            ((Y.async = !0),
                                (Y.src = $),
                                document.body.appendChild(Y));
                        },
                        j = 'chatbot-frida-knapp',
                        A = () => {
                            u({ chatbotVisible: !0 }).then(() => {
                                const p = document.getElementById(j);
                                if (!p?.click) {
                                    console.warn(
                                        'Chatbot button element does not exist on the page'
                                    );
                                    return;
                                }
                                p.click();
                            });
                        },
                        K = 5e3,
                        x = {
                            consent: { analytics: !1, surveys: !1 },
                            userActionTaken: !1,
                            meta: {
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                                version: 1,
                            },
                        },
                        R = async () =>
                            new Promise((p, h) => {
                                const w = setTimeout(() => {
                                        h(
                                            new Error(
                                                `Timed out after ${K}ms waiting for __DECORATOR_DATA__ to be set. Please check that the decorator is infact loading.`
                                            )
                                        );
                                    }, K),
                                    $ = () => {
                                        window.__DECORATOR_DATA__ &&
                                        window.webStorageController
                                            ? (clearTimeout(w), p(!0))
                                            : setTimeout($, 50);
                                    };
                                $();
                            }),
                        L = (p) =>
                            window.webStorageController?.isStorageKeyAllowed(p),
                        Q = () =>
                            window.webStorageController?.getAllowedStorage(),
                        se = () =>
                            window.webStorageController?.getCurrentConsent() ??
                            x,
                        J = (p, h, w) =>
                            L(p)
                                ? o.set(p, h, w)
                                : (console.warn(
                                      `The key ${p} is not in the allow list or user has not given consent.`
                                  ),
                                  null),
                        V = (p) =>
                            L(p)
                                ? o.get(p)
                                : (console.warn(
                                      `The key ${p} is not in the allow list or user has not given consent.`
                                  ),
                                  null),
                        z = (p) => ({
                            getItem(h) {
                                return L(h)
                                    ? p.getItem(h)
                                    : (console.warn(
                                          `The key ${h} is not in the allow list or user has not given consent.`
                                      ),
                                      null);
                            },
                            setItem(h, w) {
                                return L(h)
                                    ? (p.setItem(h, w), w)
                                    : (console.warn(
                                          `The key ${h} is not in the allow list or user has not given consent.`
                                      ),
                                      null);
                            },
                            removeItem(h) {
                                if (!L(h))
                                    return (
                                        console.warn(
                                            `The key ${h} is not in the allow list or user has not given consent.`
                                        ),
                                        null
                                    );
                                p.removeItem(h);
                            },
                            clear() {
                                p.clear();
                            },
                            key(h) {
                                return p.key(h);
                            },
                            get length() {
                                return p.length;
                            },
                        }),
                        re = () =>
                            typeof window > 'u' ? null : z(window.localStorage),
                        Ie =
                            typeof window > 'u'
                                ? null
                                : z(window.sessionStorage),
                        ce = re(),
                        he = () => Promise.resolve();
                    async function ze(p) {
                        return typeof window > 'u'
                            ? Promise.reject(
                                  'Amplitude is only available in the browser'
                              )
                            : (console.info(
                                  '[DISCONTINUED] getAmplitudeInstance is discontinued and will be removed in the next major version. Please use getAnalyticsInstance instead.'
                              ),
                              he());
                    }
                    function Be(p) {
                        return (h, w) => (
                            console.info(
                                '[DISCONTINUED] getAmplitudeInstance is discontinued and will be removed in the next major version. Please use getAnalyticsInstance instead.'
                            ),
                            he
                        );
                    }
                    const ge = async () =>
                            new Promise((p) => setTimeout(p, 500)),
                        M = async (p = 5) =>
                            typeof window.dekoratorenAnalytics == 'function'
                                ? Promise.resolve(!0)
                                : p === 0
                                  ? Promise.resolve(!1)
                                  : (await ge(), M(p - 1));
                    async function q(p) {
                        return typeof window > 'u'
                            ? Promise.reject(
                                  'Analytics is only available in the browser'
                              )
                            : (await M())
                              ? window.dekoratorenAnalytics(p)
                              : Promise.reject(
                                    'Analytics instance not found, it may not have been initialized yet'
                                );
                    }
                    function oe(p) {
                        return (h, w) =>
                            q({ eventName: h, eventData: w, origin: p });
                    }
                    ((r.awaitDecoratorData = R),
                        (r.getAllowedStorage = Q),
                        (r.getAmplitudeInstance = Be),
                        (r.getAnalyticsInstance = oe),
                        (r.getCurrentConsent = se),
                        (r.getNavCookie = V),
                        (r.getParams = c),
                        (r.injectDecoratorClientSide = U),
                        (r.isStorageKeyAllowed = L),
                        (r.logAmplitudeEvent = ze),
                        (r.logAnalyticsEvent = q),
                        (r.navLocalStorage = ce),
                        (r.navSessionStorage = Ie),
                        (r.onBreadcrumbClick = d),
                        (r.onLanguageSelect = f),
                        (r.openChatbot = A),
                        (r.setAvailableLanguages = m),
                        (r.setBreadcrumbs = s),
                        (r.setNavCookie = J),
                        (r.setParams = u));
                });
            })(Oe, Oe.exports)),
        Oe.exports
    );
}
var en = li();
const si = (e, t) => ({
        context: 'privatperson',
        language: e,
        breadcrumbs: [
            { url: `${t}/${e}`, title: Fe('breadcrumb1', e) },
            { url: '/', title: Fe('breadcrumb2', e) },
        ],
        availableLanguages: [
            { locale: 'nb', handleInApp: !0 },
            { locale: 'nn', handleInApp: !0 },
            { locale: 'en', handleInApp: !0 },
        ],
    }),
    ci = ({ locale: e = 'nb' }) => {
        const [t, n] = Z(e);
        return (
            pe(() => {
                const r = (o) => {
                    (n(o),
                        window.history.replaceState(
                            window.history.state,
                            '',
                            it.appPath[o]
                        ),
                        (document.documentElement.lang = o),
                        (document.title = Fe('documentTitle', o)),
                        en.setParams(si(o, it.kontaktOss)));
                };
                en.onLanguageSelect((o) => {
                    r(o.locale);
                });
            }, []),
            _(wa, { value: t, children: _(ri, {}) })
        );
    };
Lr.hydrateRoot(
    document.getElementById('maincontent'),
    _(v.StrictMode, {
        children: _(ci, { locale: document.documentElement.lang }),
    })
);
