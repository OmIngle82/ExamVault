declare module 'react-latex-next' {
    import { FC, ReactNode } from 'react';

    interface LatexProps {
        children?: ReactNode;
        strict?: boolean;
        macros?: Record<string, any>;
    }

    const Latex: FC<LatexProps>;
    export default Latex;
}
