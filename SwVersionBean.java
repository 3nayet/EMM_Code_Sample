package com.siemens.ecar.ch.be.core.ejb;

import com.siemens.ecar.ch.be.core.constants.PPCTConstants;
import com.siemens.ecar.ch.be.core.dao.ProcessParameterDAO;
import com.siemens.ecar.ch.be.core.data.CoreOperator;
import com.siemens.ecar.ch.be.entities.pojo.ProcessParamConfig;
import com.siemens.ecar.ch.commondata.MsgCodes;
import com.siemens.ecar.ch.rest.common.OCWebPage;
import com.siemens.ecar.ch.rest.data.RestFiltersSwVersion;
import com.siemens.ecar.ch.rest.data.RestSwVersion;
import com.siemens.ecar.ch.rest.data.RestSwVersionFilters;
import com.siemens.ecar.ch.rest.msg.RestCreationRes;
import com.siemens.ecar.ch.rest.msg.RestGenericAck;
import com.siemens.ecar.ch.rest.msg.RestGenericResponse;
import com.siemens.ecar.ch.utility.LoggerEcar;
import com.siemens.ecar.ch.utility.ValidatorUtility;

import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.toList;

@Stateless
@LocalBean
public class SwVersionBean {

    private static final LoggerEcar logger = LoggerEcar.getLogger(SwVersionBean.class);

    @EJB
    ProcessParameterDAO ppctDAO;

    public RestCreationRes insertSwVersion (RestSwVersion swVersion, CoreOperator operator) {
        logger.debug(() -> " Creating new Sw Version: " + swVersion + " and Operator" + operator);
        if (swVersion == null) {
            return new RestCreationRes(MsgCodes.CH_BE_MsgCode.DATA_NOT_VALID.getErrorCode(), "Missing data on request");
        }
        List<ProcessParamConfig> existParameters = ppctDAO.findPPCValues(PPCTConstants.PPCT_APP_MGMT,
            PPCTConstants.DEFAULT, swVersion.getAppId(), PPCTConstants.DEFAULT);

        if (!existParameters.isEmpty()) {
            //param exist
            logger.warn(() -> "params already exist for Sw with appId " + swVersion.getAppId());
            return new RestCreationRes(MsgCodes.CH_BE_MsgCode.DUPLICATE_RECORD.getErrorCode(),
                "A recrod for " + swVersion.getAppId() + " already exists");
        }
        logger.debug(() -> " inserting params for : " + swVersion.getAppId());
        this.ppctDAO.insertPPCT(PPCTConstants.PPCT_APP_MGMT, PPCTConstants.DEFAULT, swVersion.getAppId(),
            PPCTConstants.DEFAULT, PPCTConstants.PARAM_NAME_URL_TC, swVersion.getUrlTC());
        this.ppctDAO.insertPPCT(PPCTConstants.PPCT_APP_MGMT, PPCTConstants.DEFAULT, swVersion.getAppId(),
            PPCTConstants.DEFAULT, PPCTConstants.PARAM_NAME_DATE_TC,
            Optional.ofNullable(swVersion.getDateTC())
                .map(d -> new SimpleDateFormat(PPCTConstants.PPCT_DATE_FORMAT).format(d)).orElse(null));
        this.ppctDAO.insertPPCT(PPCTConstants.PPCT_APP_MGMT, PPCTConstants.DEFAULT, swVersion.getAppId(),
            PPCTConstants.DEFAULT, PPCTConstants.PARAM_NAME_SW_VERSION, swVersion.getSwVersion());
        this.ppctDAO.insertPPCT(PPCTConstants.PPCT_APP_MGMT, PPCTConstants.DEFAULT, swVersion.getAppId(),
            PPCTConstants.DEFAULT, PPCTConstants.PARAM_NAME_APP_MSG, swVersion.getMessage());
        this.ppctDAO.insertPPCT(PPCTConstants.PPCT_APP_MGMT, PPCTConstants.DEFAULT, swVersion.getAppId(),
            PPCTConstants.DEFAULT, PPCTConstants.PARAM_NAME_DATE_VALIDITY,
            Optional.ofNullable(swVersion.getMessageValidity())
                .map(d -> new SimpleDateFormat(PPCTConstants.PPCT_DATE_FORMAT).format(d)).orElse(null));

        return new RestCreationRes(MsgCodes.CH_BE_MsgCode.OK.getErrorCode(), "");
    }

    public RestGenericAck modifySwVersion (RestSwVersion swVersion, CoreOperator operator) {
        logger.debug(() -> " Modifying  Sw Version: " + swVersion + " and Operator" + operator);
        if (swVersion == null) {
            logger.warn(() -> " Called modifySwVersion with null or empty swVersion ");
            return new RestGenericAck(RestGenericResponse.ResponseCode.UNKNOWN, (short) 1);
        }
        logger.debug(() -> " Retrieving Sw Version params.. ");
        List<ProcessParamConfig> existParameters = ppctDAO.findPPCValues(PPCTConstants.PPCT_APP_MGMT,
            PPCTConstants.DEFAULT, swVersion.getAppId(), PPCTConstants.DEFAULT);
        if (existParameters.isEmpty()) {
            logger.warn(() -> " No params found for Sw with appId " + swVersion.getAppId());
            //doesn't exist error
            return new RestGenericAck(RestGenericResponse.ResponseCode.UNKNOWN, (short) 1);
        }
        //updating ppct values
        existParameters.forEach(ppct -> {
            switch (ppct.getId().getParamName()) {
                case PPCTConstants.PARAM_NAME_URL_TC:
                    if (!Objects.equals(ppct.getParamValue(), swVersion.getUrlTC()))
                        ppct.setParamValue(swVersion.getUrlTC());
                    break;
                case PPCTConstants.PARAM_NAME_DATE_TC:
                    if (!(Objects.equals(Optional.ofNullable(swVersion.getDateTC())
                        .map(d -> new SimpleDateFormat(PPCTConstants.PPCT_DATE_FORMAT).format(d)).orElse(null),
                        ppct.getParamValue()))) {
                        ppct.setParamValue(Optional.ofNullable(swVersion.getDateTC())
                            .map(d -> new SimpleDateFormat(PPCTConstants.PPCT_DATE_FORMAT).format(d)).orElse(null));
                    }
                    break;
                case PPCTConstants.PARAM_NAME_SW_VERSION:
                    if (!Objects.equals(ppct.getParamValue(), swVersion.getSwVersion()))
                        ppct.setParamValue(swVersion.getSwVersion());
                    break;
                case PPCTConstants.PARAM_NAME_APP_MSG:
                    if (!Objects.equals(ppct.getParamValue(), swVersion.getMessage()))
                        ppct.setParamValue(swVersion.getMessage());
                    break;
                case PPCTConstants.PARAM_NAME_DATE_VALIDITY:
                    if (!(Objects.equals(Optional.ofNullable(swVersion.getMessageValidity())
                        .map(d -> new SimpleDateFormat(PPCTConstants.PPCT_DATE_FORMAT).format(d)).orElse(null),
                        ppct.getParamValue()))) {
                        ppct.setParamValue(Optional.ofNullable(swVersion.getMessageValidity())
                            .map(d -> new SimpleDateFormat(PPCTConstants.PPCT_DATE_FORMAT).format(d)).orElse(null));
                    }
                    break;
                default:
                    break;
            }
        });

        return new RestGenericAck(RestGenericResponse.ResponseCode.OK, (short) 0);
    }

    public RestSwVersion findSwVersion (String appId, CoreOperator operator) {

        logger.debug(() -> " Retrieving SwVersioneving Sw Version info for appId" + appId + " and Operator" + operator);
        if (ValidatorUtility.isNullOrEmpty(appId)) {
            logger.warn(() -> " Called findSwVersion with empty appId ");
            return null;
        }
        List<ProcessParamConfig> parameters = ppctDAO.findPPCValues(PPCTConstants.PPCT_APP_MGMT,
            PPCTConstants.DEFAULT, appId,
            PPCTConstants.DEFAULT);

        logger.debug(() -> " Retrieved " + parameters.size() + " parameters for Sw Version ");

        RestSwVersion swVersion = getRestSwVersionFromProcessParamList(parameters);
        swVersion.setAppId(appId);
        return swVersion;
    }

    public List<String> findAppIdList (CoreOperator operator) {
        logger.debug(() -> " Retrieving list of App in Sw Version for operator " + operator);

        return ppctDAO.findDistinctSearchKey1(PPCTConstants.PPCT_APP_MGMT);

    }

    public RestFiltersSwVersion findSwVersionFilters (OCWebPage ocWebPage, CoreOperator operator) {
        logger.debug(() -> " Retrieving RestFiltersSwVersion for operator " + operator + " on OCWebPage " + ocWebPage.name());
        RestFiltersSwVersion res = new RestFiltersSwVersion();
        res.setAppId(ppctDAO.findDistinctSearchKey1(PPCTConstants.PPCT_APP_MGMT));

        return res;
    }

    public List<RestSwVersion> findSwVersionList (RestSwVersionFilters filters, CoreOperator operator) {
        logger.debug(() -> " Retrieving lRestFiltersSwVersion for operator " + operator + " on filters " + filters);
        List<String> appIds = filters.getAppId();
        if (ValidatorUtility.isNullOrEmpty(appIds))
            appIds = findAppIdList(operator);

        if (ValidatorUtility.isNullOrEmpty(appIds)) {
            return Collections.emptyList();
        }
        Map<String, List<ProcessParamConfig>> params = ppctDAO.findPPCValues(PPCTConstants.PPCT_APP_MGMT, appIds);
        return params.keySet().stream().map(key -> getRestSwVersionFromProcessParamList(params.get(key)))
            .collect(Collectors.toList());

    }

    private RestSwVersion getRestSwVersionFromProcessParamList (List<ProcessParamConfig> parameters) {

        RestSwVersion swVersion = new RestSwVersion();

        List<String> appIds =
            parameters.stream().map(param -> param.getId().getSearchKey1()).distinct().collect(toList());
        if (appIds.size() > 1) {
            logger.error("params with more than one appId");
        }
        if(!ValidatorUtility.isNullOrEmpty(appIds))
            swVersion.setAppId(Optional.ofNullable(appIds.get(0)).orElse(""));

        parameters.forEach(ppct -> {
            switch (ppct.getId().getParamName()) {
                case PPCTConstants.PARAM_NAME_URL_TC:
                    swVersion.setUrlTC(ppct.getParamValue());
                    break;
                case PPCTConstants.PARAM_NAME_DATE_TC:
                    try {
                        swVersion.setDateTC(Objects.equals(ppct.getParamValue(), null) ? null :
                            new SimpleDateFormat(PPCTConstants.PPCT_DATE_FORMAT).parse(ppct.getParamValue()));
                    } catch (ParseException e) {
                        logger.warn(() -> "cannot parse DateTC " + ppct.getParamValue());
                        swVersion.setDateTC(null);
                    }
                    break;
                case PPCTConstants.PARAM_NAME_SW_VERSION:
                    swVersion.setSwVersion(ppct.getParamValue());
                    break;
                case PPCTConstants.PARAM_NAME_APP_MSG:
                    swVersion.setMessage(ppct.getParamValue());
                    break;
                case PPCTConstants.PARAM_NAME_DATE_VALIDITY:
                    try {
                        swVersion.setMessageValidity(Objects.equals(ppct.getParamValue(), null) ? null :
                            new SimpleDateFormat(PPCTConstants.PPCT_DATE_FORMAT).parse(ppct.getParamValue()));
                    } catch (ParseException e) {
                        logger.warn(() -> "cannot parse messageValidity " + ppct.getParamValue());
                        swVersion.setMessageValidity(null);
                    }
                    break;
                default:
                    break;
            }
        });
        return swVersion;
    }


}
