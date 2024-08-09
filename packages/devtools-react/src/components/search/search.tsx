import { SearchIcon } from "icons/search";
import { createStyles } from "theme/use-styles.hook";

const styles = createStyles((theme, css) => {
  return {
    wrapper: css`
      display: flex;
      gap: 2px;
      position: relative;
      align-items: center;
    `,
    input: css`
      background-color: transparent;
      font-size: 14px;
      color: #fff;
      padding: 2px 2px 2px 22px;
      outline: none;
      min-width: 80px;
      border-radius: 4px;
      border: 1px solid rgb(77, 78, 79);
      height: 24px;
    `,
    icon: css`
      position: absolute;
      pointer-events: none;
      margin-left: 5px;
      fill: #fff;
    `,
  };
});

export const Search = ({
  ...props
}: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>) => {
  const css = styles.useStyles();
  return (
    <div className={css.wrapper}>
      <SearchIcon height="14px" width="14px" className={css.icon} />
      <input type="text" {...props} className={styles.clsx(css.input, props.className)} />
    </div>
  );
};
