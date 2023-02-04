import { OfficeSearchApp } from '../components/OfficeSearchApp';
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async () => {
    return {
        props: {},
        revalidate: 300
    };
};

export default OfficeSearchApp;
