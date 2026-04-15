/*
 * Copyright (c) 2026 by Christian Kellner.
 * Licensed under Apache-2.0 with Commons Clause and Attribution/Naming Clause
 */

import { useState, useEffect, useMemo } from 'react';
import {
  useSearchParamState,
  parseNumber,
  parseString,
  parseNullableBoolean,
} from '../../../hooks/useSearchParamState.js';
import {
  Card,
  Col,
  Row,
  Image,
  Button,
  Typography,
  Pagination,
  Toast,
  Divider,
  Input,
  Select,
  Empty,
  Radio,
  RadioGroup,
  Space,
  Modal,
} from '@douyinfe/semi-ui-19';
import {
  IconBriefcase,
  IconCart,
  IconClock,
  IconDelete,
  IconMapPin,
  IconStar,
  IconStarStroked,
  IconSearch,
  IconActivity,
  IconEyeOpened,
  IconArrowUp,
  IconArrowDown,
  IconNoteMoney,
  IconHome,
  IconPercentage,
  IconFilter,
  IconMenu,
} from '@douyinfe/semi-icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ListingDeletionModal from '../../ListingDeletionModal.jsx';
import PriceRatingBadge from '../../PriceRatingBadge.jsx';
import no_image from '../../../assets/no_image.jpg';
import * as timeService from '../../../services/time/timeService.js';
import { xhrDelete, xhrPost } from '../../../services/xhr.js';
import { useActions, useSelector } from '../../../services/state/store.js';
import { debounce } from '../../../utils';

import './ListingsGrid.less';
import '../../ListingDeletionModal.less';
import { IllustrationNoResult, IllustrationNoResultDark } from '@douyinfe/semi-illustrations';

const { Text } = Typography;

const ListingsGrid = () => {
  const listingsData = useSelector((state) => state.listingsData);
  const providers = useSelector((state) => state.provider);
  const jobs = useSelector((state) => state.jobsData.jobs);
  const actions = useActions();
  const navigate = useNavigate();
  const sp = useSearchParams();

  const [page, setPage] = useSearchParamState(sp, 'page', 1, parseNumber);
  const pageSize = 40;

  const [sortField, setSortField] = useSearchParamState(sp, 'sort', 'created_at', parseString);
  const [sortDir, setSortDir] = useSearchParamState(sp, 'dir', 'desc', parseString);
  const [freeTextFilter, setFreeTextFilter] = useSearchParamState(sp, 'q', null, parseString);
  const [watchListFilter, setWatchListFilter] = useSearchParamState(sp, 'watch', null, parseNullableBoolean);
  const [jobNameFilter, setJobNameFilter] = useSearchParamState(sp, 'job', null, parseString);
  const [activityFilter, setActivityFilter] = useSearchParamState(sp, 'active', null, parseNullableBoolean);
  const [providerFilter, setProviderFilter] = useSearchParamState(sp, 'provider', null, parseString);
  const [priceRatingFilter, setPriceRatingFilter] = useSearchParamState(sp, 'rating', null, parseString);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [listingToDelete, setListingToDelete] = useState(null);
  const [deleteAllModalVisible, setDeleteAllModalVisible] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const loadData = () => {
    actions.listingsData.getListingsData({
      page,
      pageSize,
      sortfield: sortField,
      sortdir: sortDir,
      freeTextFilter,
      filter: { watchListFilter, jobNameFilter, activityFilter, providerFilter },
    });
  };

  useEffect(() => {
    loadData();
  }, [page, sortField, sortDir, freeTextFilter, providerFilter, activityFilter, jobNameFilter, watchListFilter]);

  const handleFilterChange = useMemo(
    () =>
      debounce((value) => {
        setFreeTextFilter(value || null);
        setPage(1);
      }, 500),
    [],
  );

  useEffect(() => {
    return () => {
      // cleanup debounced handler to avoid memory leaks
      handleFilterChange.cancel && handleFilterChange.cancel();
    };
  }, [handleFilterChange]);

  const handleWatch = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await xhrPost('/api/listings/watch', { listingId: item.id });
      Toast.success(item.isWatched === 1 ? 'Listing removed from Watchlist' : 'Listing added to Watchlist');
      loadData();
    } catch (e) {
      console.error(e);
      Toast.error('Failed to operate Watchlist');
    }
  };

  const handlePageChange = (_page) => {
    setPage(_page);
  };

  const confirmDeleteAll = async () => {
    try {
      await xhrDelete('/api/listings/all', { hardDelete: true });
      Toast.success('Alle Listings erfolgreich gelöscht');
      loadData();
    } catch (error) {
      Toast.error(error.message || 'Fehler beim Löschen');
    } finally {
      setDeleteAllModalVisible(false);
    }
  };

  const confirmDeletion = async (hardDelete) => {
    try {
      await xhrDelete('/api/listings/', { ids: [listingToDelete], hardDelete });
      Toast.success('Listing successfully removed');
      loadData();
    } catch (error) {
      Toast.error(error.message || 'Error deleting listing');
    } finally {
      setDeleteModalVisible(false);
      setListingToDelete(null);
    }
  };

  const cap = (val) => {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
  };

  const getJobRating = (item) => {
    if (!item.price || !(item.size > 0)) return null;
    const pricePerSqm = Math.round(item.price / item.size);
    const specFilter = jobs.find((j) => j.id === item.job_id)?.specFilter;
    const lowMax = specFilter?.sqmLowMax ?? 1499;
    const mediumMax = specFilter?.sqmMediumMax ?? 2499;
    if (pricePerSqm > mediumMax) return 'high';
    if (pricePerSqm > lowMax) return 'medium';
    return 'low';
  };

  const visibleListings = (listingsData?.result || []).filter((item) => {
    if (!priceRatingFilter) return true;
    return getJobRating(item) === priceRatingFilter;
  });

  return (
    <div className="listingsGrid">
      <div className="listingsGrid__topbar">
        <div className="listingsGrid__topbar__row1">
          <Button
            className="listingsGrid__navToggle"
            icon={<IconMenu />}
            onClick={() => window.dispatchEvent(new CustomEvent('fredy:openNav'))}
            theme="borderless"
            aria-label="Open menu"
          />
          <Input
            className="listingsGrid__topbar__search"
            prefix={<IconSearch />}
            showClear
            placeholder="Search"
            defaultValue={freeTextFilter ?? ''}
            onChange={handleFilterChange}
          />
          <Button
            className="listingsGrid__filterToggle"
            icon={<IconFilter />}
            onClick={() => setFiltersOpen((f) => !f)}
            type={filtersOpen ? 'primary' : 'tertiary'}
            theme="light"
          >
            Filter
          </Button>
          <Button
            className="listingsGrid__deleteAllBtn"
            type="danger"
            theme="light"
            icon={<IconDelete />}
            onClick={() => setDeleteAllModalVisible(true)}
          >
            <span className="listingsGrid__deleteAllLabel">Alle löschen</span>
          </Button>
        </div>

        <div className={`listingsGrid__topbar__filters${filtersOpen ? ' listingsGrid__topbar__filters--open' : ''}`}>
          <RadioGroup
            type="button"
            buttonSize="middle"
            value={activityFilter === null ? 'all' : String(activityFilter)}
            onChange={(e) => {
              const v = e.target.value;
              setActivityFilter(v === 'all' ? null : v === 'true');
              setPage(1);
            }}
          >
            <Radio value="all">All</Radio>
            <Radio value="true">Active</Radio>
            <Radio value="false">Inactive</Radio>
          </RadioGroup>

          <RadioGroup
            type="button"
            buttonSize="middle"
            value={watchListFilter === null ? 'all' : String(watchListFilter)}
            onChange={(e) => {
              const v = e.target.value;
              setWatchListFilter(v === 'all' ? null : v === 'true');
              setPage(1);
            }}
          >
            <Radio value="all">All</Radio>
            <Radio value="true">Watched</Radio>
            <Radio value="false">Unwatched</Radio>
          </RadioGroup>

          <Select
            placeholder="Provider"
            showClear
            onChange={(val) => {
              setProviderFilter(val);
              setPage(1);
            }}
            value={providerFilter}
            style={{ width: 130 }}
          >
            {providers?.map((p) => (
              <Select.Option key={p.id} value={p.id}>
                {p.name}
              </Select.Option>
            ))}
          </Select>

          <Select
            placeholder="Job"
            showClear
            onChange={(val) => {
              setJobNameFilter(val);
              setPage(1);
            }}
            value={jobNameFilter}
            style={{ width: 130 }}
          >
            {jobs?.map((j) => (
              <Select.Option key={j.id} value={j.id}>
                {j.name}
              </Select.Option>
            ))}
          </Select>

          <Select prefix="Sort by" style={{ width: 185 }} value={sortField} onChange={(val) => setSortField(val)}>
            <Select.Option value="job_name">Job Name</Select.Option>
            <Select.Option value="created_at">Listing Date</Select.Option>
            <Select.Option value="price">Price</Select.Option>
            <Select.Option value="provider">Provider</Select.Option>
          </Select>

          <Button
            icon={sortDir === 'asc' ? <IconArrowUp /> : <IconArrowDown />}
            onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
          />

          <RadioGroup
            type="button"
            buttonSize="middle"
            value={priceRatingFilter ?? 'all'}
            onChange={(e) => {
              const v = e.target.value;
              setPriceRatingFilter(v === 'all' ? null : v);
              setPage(1);
            }}
          >
            <Radio value="all">All</Radio>
            <Radio value="low">
              <span style={{ color: '#52c41a', fontWeight: 700 }}>LOW</span>
            </Radio>
            <Radio value="medium">
              <span style={{ color: '#fa8c16', fontWeight: 700 }}>MEDIUM</span>
            </Radio>
            <Radio value="high">
              <span style={{ color: '#ff4d4f', fontWeight: 700 }}>HIGH</span>
            </Radio>
          </RadioGroup>
        </div>
      </div>

      {visibleListings.length === 0 && (
        <Empty
          image={<IllustrationNoResult />}
          darkModeImage={<IllustrationNoResultDark />}
          description="No listings available yet..."
        />
      )}
      <Row gutter={[16, 16]}>
        {visibleListings.map((item) => (
          <Col key={item.id} xs={24} sm={12} md={12} lg={8} xl={8} xxl={6}>
            <Card
              className={`listingsGrid__card ${!item.is_active ? 'listingsGrid__card--inactive' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/listings/listing/${item.id}`)}
              cover={
                <div style={{ position: 'relative' }}>
                  <div className="listingsGrid__imageContainer">
                    <Image
                      src={item.image_url || no_image}
                      fallback={no_image}
                      width="100%"
                      height={180}
                      style={{ objectFit: 'cover' }}
                      preview={false}
                    />
                    <Button
                      icon={
                        item.isWatched === 1 ? (
                          <IconStar style={{ color: 'rgba(var(--semi-green-5), 1)' }} />
                        ) : (
                          <IconStarStroked />
                        )
                      }
                      theme="light"
                      shape="circle"
                      size="small"
                      className="listingsGrid__watchButton"
                      onClick={(e) => handleWatch(e, item)}
                    />
                  </div>
                  {!item.is_active && <div className="listingsGrid__inactiveOverlay">Inactive</div>}
                </div>
              }
              bodyStyle={{ padding: '12px' }}
            >
              <div className="listingsGrid__content">
                <Text strong ellipsis={{ showTooltip: true }} className="listingsGrid__title">
                  {cap(item.title)}
                </Text>
                <div className="listingsGrid__price">
                  <IconCart size="small" />
                  {item.price} €
                  {item.price && item.size > 0 && (
                    <>
                      <Text type="tertiary" size="small" style={{ marginLeft: '8px' }}>
                        · {Math.round(item.price / item.size).toLocaleString('de-DE')} €/m²
                      </Text>
                      <PriceRatingBadge
                        pricePerSqm={Math.round(item.price / item.size)}
                        specFilter={jobs.find((j) => j.id === item.job_id)?.specFilter}
                      />
                    </>
                  )}
                </div>
                {item.price > 0 && (
                  <div className="listingsGrid__nk">
                    <IconNoteMoney size="small" />
                    {Math.round(item.price * 0.1207).toLocaleString('de-DE')} €
                    <sup className="listingsGrid__nkLabel">Nebenkosten</sup>
                  </div>
                )}
                {(() => {
                  const spec = jobs.find((j) => j.id === item.job_id)?.specFilter;
                  const rental = spec?.rentalPricePerSqm;
                  const fq = spec?.finanzierungsquotient;
                  if (!rental || !item.size) return null;
                  const mieteinnahmen = Math.round(item.size * rental);
                  const roiJahre = item.price > 0 ? (item.price / (mieteinnahmen * 12)).toFixed(1) : null;
                  const rate = fq && item.price > 0 ? Math.round((item.price * (fq / 100)) / 12) : null;
                  const uberschuss = rate != null ? mieteinnahmen - rate : null;
                  return (
                    <div className="listingsGrid__rendite">
                      <div className="listingsGrid__renditeRow">
                        <IconHome size="extra-small" />
                        <span className="listingsGrid__renditeItem">
                          {mieteinnahmen.toLocaleString('de-DE')} €
                          <sup className="listingsGrid__nkLabel">Einnahmen</sup>
                        </span>
                        {rate != null && (
                          <>
                            <span className="listingsGrid__renditeSep">·</span>
                            <IconPercentage size="extra-small" />
                            <span className="listingsGrid__renditeItem">
                              {rate.toLocaleString('de-DE')} €<sup className="listingsGrid__nkLabel">Rate</sup>
                            </span>
                            <span className="listingsGrid__renditeSep">·</span>
                            <span
                              className={`listingsGrid__renditeItem ${uberschuss >= 0 ? 'listingsGrid__renditePositiv' : 'listingsGrid__renditeNegativ'}`}
                            >
                              {uberschuss >= 0 ? '+' : ''}
                              {uberschuss.toLocaleString('de-DE')} €
                              <sup className="listingsGrid__nkLabel">Überschuss</sup>
                            </span>
                          </>
                        )}
                      </div>
                      {roiJahre && (
                        <div className="listingsGrid__renditeRow">
                          <span className="listingsGrid__roiBadge">ROI {roiJahre} J.</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
                <div className="listingsGrid__meta">
                  <Text
                    type="secondary"
                    icon={<IconMapPin />}
                    size="small"
                    ellipsis={{ showTooltip: true }}
                    style={{ width: '100%' }}
                  >
                    {item.address || 'No address provided'}
                  </Text>
                  <Space spacing={12} wrap>
                    <div className="listingsGrid__sources">
                      {[
                        { provider: item.provider, link: item.link },
                        ...(item.additional_sources ? JSON.parse(item.additional_sources) : []),
                      ].map((src, i) => (
                        <a
                          key={i}
                          href={src.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="listingsGrid__sourceLink"
                          onClick={(e) => e.stopPropagation()}
                          title={src.provider.charAt(0).toUpperCase() + src.provider.slice(1)}
                        >
                          <IconBriefcase size="small" />
                          <span>{src.provider.charAt(0).toUpperCase() + src.provider.slice(1)}</span>
                        </a>
                      ))}
                    </div>
                    <Text type="tertiary" size="small" icon={<IconClock />}>
                      {timeService.format(item.created_at, false)}
                    </Text>
                  </Space>
                  {item.distance_to_destination ? (
                    <Text type="tertiary" size="small" icon={<IconActivity />}>
                      {item.distance_to_destination} m to chosen address
                    </Text>
                  ) : (
                    <Text type="tertiary" size="small" icon={<IconActivity />}>
                      Distance cannot be calculated
                    </Text>
                  )}
                </div>
                <Divider margin=".6rem" />
                <div className="listingsGrid__actions">
                  <Button
                    type="secondary"
                    size="small"
                    title="View Details"
                    onClick={() => navigate(`/listings/listing/${item.id}`)}
                    icon={<IconEyeOpened />}
                  />
                  <Button
                    title="Remove"
                    type="danger"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setListingToDelete(item.id);
                      setDeleteModalVisible(true);
                    }}
                    icon={<IconDelete />}
                  />
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      {visibleListings.length > 0 && (
        <div className="listingsGrid__pagination">
          <Pagination
            currentPage={page}
            pageSize={pageSize}
            total={listingsData?.totalNumber || 0}
            onPageChange={handlePageChange}
            showSizeChanger={false}
          />
        </div>
      )}
      <ListingDeletionModal
        visible={deleteModalVisible}
        onConfirm={confirmDeletion}
        onCancel={() => {
          setDeleteModalVisible(false);
          setListingToDelete(null);
        }}
      />
      <Modal
        title="Alle Listings löschen"
        visible={deleteAllModalVisible}
        onCancel={() => setDeleteAllModalVisible(false)}
        footer={null}
        className="deletionModal"
        closable
      >
        <div className="deletionModal__body">
          <p>Bist du sicher? Alle Listings werden unwiderruflich aus der Datenbank gelöscht.</p>
          <div className="deletionModal__footer">
            <Button type="danger" size="large" block onClick={confirmDeleteAll}>
              Ja, alle löschen
            </Button>
            <Button type="tertiary" size="large" block onClick={() => setDeleteAllModalVisible(false)}>
              Abbrechen
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ListingsGrid;
