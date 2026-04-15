/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { useState } from 'react';
import { Button, Modal, Radio, RadioGroup, Typography } from '@douyinfe/semi-ui-19';

import './ListingDeletionModal.less';

const { Text } = Typography;

const ListingDeletionModal = ({
  visible,
  onConfirm,
  onCancel,
  title = 'Delete Listings',
  showOptions = true,
  message = 'How would you like to delete the selected listing(s)?',
}) => {
  const [deleteType, setDeleteType] = useState('soft');

  const handleOk = () => {
    onConfirm(!showOptions || deleteType === 'hard');
  };

  return (
    <Modal title={title} visible={visible} onCancel={onCancel} footer={null} className="deletionModal" closable>
      <div className="deletionModal__body">
        <Text className="deletionModal__message">{message}</Text>

        {showOptions && (
          <RadioGroup
            value={deleteType}
            onChange={(e) => setDeleteType(e.target.value)}
            className="deletionModal__options"
          >
            <label
              className={`deletionModal__option${deleteType === 'soft' ? ' deletionModal__option--selected' : ''}`}
              onClick={() => setDeleteType('soft')}
            >
              <Radio value="soft" />
              <div className="deletionModal__optionText">
                <Text strong>Mark as deleted (Soft Delete)</Text>
                <Text type="secondary" size="small">
                  Listings are kept in the database but hidden. They will <b>not</b> re-appear during the next scraping
                  session.
                </Text>
              </div>
            </label>

            <label
              className={`deletionModal__option${deleteType === 'hard' ? ' deletionModal__option--selected' : ''}`}
              onClick={() => setDeleteType('hard')}
            >
              <Radio value="hard" />
              <div className="deletionModal__optionText">
                <Text strong>Remove from database (Hard Delete)</Text>
                <Text type="secondary" size="small">
                  Listings are completely removed.{' '}
                  <Text type="warning" size="small">
                    They might re-appear on the next scrape.
                  </Text>
                </Text>
              </div>
            </label>
          </RadioGroup>
        )}

        <div className="deletionModal__footer">
          <Button type="danger" size="large" block onClick={handleOk}>
            Confirm Delete
          </Button>
          <Button type="tertiary" size="large" block onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ListingDeletionModal;
