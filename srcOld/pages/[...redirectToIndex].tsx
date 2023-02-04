import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
    // Redirect all requests to app base path
    return {
        props: {},
        redirect: {
            destination: '/',
        },
    };
};

const BlankPlaceholder = () => null;

export default BlankPlaceholder;
