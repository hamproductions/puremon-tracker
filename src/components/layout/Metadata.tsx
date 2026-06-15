import { Fragment } from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'ピュアモン ブロマイド管理';
const DEFAULT_DESC =
  'ピュアリーモンスターのブロマイド・コレクション管理＆交換ツール。所持/未所持の記録、不足の確認、譲渡テキスト作成までログイン不要で使えます。';

interface MetadataProps {
  title?: string;
  description?: string;
  helmet?: boolean;
}

export function Metadata({ title, description, helmet }: MetadataProps) {
  const fullTitle = title ? `${title}｜${SITE_NAME}` : SITE_NAME;
  const desc = description ?? DEFAULT_DESC;
  const Wrapper = helmet ? Helmet : Fragment;
  return (
    <Wrapper>
      <title>{fullTitle}</title>
      <meta data-rh="true" name="description" content={desc} />
      <meta data-rh="true" property="og:type" content="website" />
      <meta data-rh="true" property="og:site_name" content={SITE_NAME} />
      <meta data-rh="true" property="og:title" content={fullTitle} />
      <meta data-rh="true" property="og:description" content={desc} />
      <meta data-rh="true" property="og:locale" content="ja_JP" />
      <meta data-rh="true" name="twitter:card" content="summary_large_image" />
      <meta data-rh="true" name="twitter:title" content={fullTitle} />
      <meta data-rh="true" name="twitter:description" content={desc} />
    </Wrapper>
  );
}
