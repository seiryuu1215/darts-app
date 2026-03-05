import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from '@storybook/test';
import SessionCompareCard from '@/components/stats/SessionCompareCard';
import { MOCK_COUNTUP_PLAYS } from '../mocks/dartslive-stats';

const meta: Meta<typeof SessionCompareCard> = {
  title: 'Stats/SessionCompareCard',
  component: SessionCompareCard,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj<typeof SessionCompareCard>;

export const Standard: Story = {
  args: {
    countupPlays: MOCK_COUNTUP_PLAYS,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルが表示されている
    await expect(canvas.getByText('練習日比較 (30G以上)')).toBeInTheDocument();

    // メトリクス比較テーブルのヘッダーが表示されている
    await expect(canvas.getByText('メトリクス比較')).toBeInTheDocument();
    await expect(canvas.getByText('差分')).toBeInTheDocument();

    // 主要メトリクスラベルが表示されている
    await expect(canvas.getByText('ブル率')).toBeInTheDocument();
    await expect(canvas.getByText('DBull率')).toBeInTheDocument();
    await expect(canvas.getByText('ロートン率')).toBeInTheDocument();
    await expect(canvas.getByText('ハット率')).toBeInTheDocument();
    await expect(canvas.getByText('平均スコア')).toBeInTheDocument();
    await expect(canvas.getByText('安定度')).toBeInTheDocument();

    // ヒートマップセクションが表示されている
    await expect(canvas.getByText('ミスヒートマップ')).toBeInTheDocument();

    // ミス方向セクションが表示されている
    await expect(canvas.getByText('ミス方向')).toBeInTheDocument();

    // スコア分布比較が表示されている
    await expect(canvas.getByText('スコア分布比較')).toBeInTheDocument();

    // vsが表示されている（2つのセッション）
    await expect(canvas.getByText('vs')).toBeInTheDocument();
  },
};

export const InsufficientData: Story = {
  args: {
    countupPlays: MOCK_COUNTUP_PLAYS.slice(0, 10),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 30G未満のデータではカードが表示されないことを確認
    const title = canvas.queryByText('練習日比較 (30G以上)');
    await expect(title).toBeNull();
  },
};

export const EmptyData: Story = {
  args: {
    countupPlays: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 空データではカードが表示されないことを確認
    const title = canvas.queryByText('練習日比較 (30G以上)');
    await expect(title).toBeNull();
  },
};

export const SingleSession: Story = {
  args: {
    countupPlays: MOCK_COUNTUP_PLAYS.slice(0, 35),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1セッションのみでは比較不可のためカードが表示されない
    const title = canvas.queryByText('練習日比較 (30G以上)');
    await expect(title).toBeNull();
  },
};
