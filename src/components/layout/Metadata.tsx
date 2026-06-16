import { Fragment } from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'ピュアリーモンスター ブロマイド管理';
const DEFAULT_DESC =
  'ピュアリーモンスターのブロマイド・コレクション管理＆交換ツール。ログインして所持/未所持を同期し、不足確認と画像投稿ができます。';

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
