export const clientUrls = {
    appPath: {
        nb: import.meta.env.VITE_APP_BASEPATH,
        nn: `${import.meta.env.VITE_APP_BASEPATH}/nn`,
        en: `${import.meta.env.VITE_APP_BASEPATH}/en`,
    },
    searchApi: `${import.meta.env.VITE_APP_ORIGIN}${
        import.meta.env.VITE_APP_BASEPATH
    }/api/search`,
    kontaktOss: `${import.meta.env.VITE_NAVNO_ORIGIN}/person/kontakt-oss`,
};
