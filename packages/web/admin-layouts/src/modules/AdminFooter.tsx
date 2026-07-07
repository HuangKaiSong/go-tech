import { DarkModeContainer } from '@go-tech/web-ui-compose';

const GlobalFooter = () => {
  return (
    <DarkModeContainer className="h-full flex-center">
      <a href="https://github.com/Ohh-889/go-tech-admin/blob/master/LICENSE" rel="noopener noreferrer" target="_blank">
        Copyright MIT © 2021 go-tech
      </a>
    </DarkModeContainer>
  );
};

export default GlobalFooter;
